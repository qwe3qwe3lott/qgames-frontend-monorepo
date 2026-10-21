import {resolveUrl} from '@qgames/api';
import type {RoomResponseGameCode} from '@qgames/api/gateway/model';
import {
  SessionStreamEvent,
  type SessionStreamEventOutput,
} from '@qgames/api/gateway/zod';
import {
  checkSeq,
  isSessionOver,
  reduceSession,
  sessionFromSnapshot,
  type GameReducer,
} from '@qgames/game-core';
import {useQueryClient, type QueryClient} from '@tanstack/react-query';
import {useEffect, useState} from 'react';

import {createEventStream, type EventStream} from '@/shared/lib';

import {sessionStreamQueryOptions} from './query';

/**
 * Адрес потока `GET /api/games/{gameCode}/rooms/{roomId}/sessions/{sessionId}/events`.
 * Клиент Orval для SSE-ручек не генерируется (`packages/api/orval.config.ts`),
 * поэтому путь собирается здесь.
 */
function sessionEventsUrl(
  gameCode: RoomResponseGameCode,
  roomId: string,
  sessionId: string,
): string {
  const game = encodeURIComponent(gameCode);
  const room = encodeURIComponent(roomId);
  const session = encodeURIComponent(sessionId);
  return resolveUrl(
    `/api/games/${game}/rooms/${room}/sessions/${session}/events`,
  );
}

/** Типы событий потока — из схемы контракта, а не списком руками. */
const SESSION_EVENT_TYPES = SessionStreamEvent.options.flatMap(
  option => option.shape.type.options,
);

/**
 * Пауза перед повторной сверкой (дыра в seq или сообщение не по контракту):
 * первая — сразу, дальше удваивается, пока событие журнала не применится.
 */
const RESYNC_BASE_MS = 1000;
const RESYNC_MAX_MS = 30_000;

/**
 * Состояние потока партии: `connecting` — первое подключение, `open` — поток
 * идёт, `reconnecting` — связь или события потеряны, идёт переподключение за
 * свежим снапшотом, `closed` — поток закрыт насовсем (партия закончилась или
 * сессию не обновить).
 */
export type SessionEventsStatus =
  'connecting' | 'open' | 'reconnecting' | 'closed';

/**
 * Итог применения сообщения: `applied` — кеш обновлён, `skipped` — повтор
 * (seq уже применён), `resync` — событие потеряно, нужен свежий снапшот,
 * `ended` — партия закончилась, поток больше не нужен.
 */
type ApplyResult = 'applied' | 'skipped' | 'resync' | 'ended';

/** Применяет сообщение потока к партии в кеше Query. */
function applySessionEvent(
  queryClient: QueryClient,
  sessionId: string,
  event: SessionStreamEventOutput,
  reduce: GameReducer,
  receivedAt: number,
): ApplyResult {
  const {queryKey} = sessionStreamQueryOptions(sessionId);
  if (event.type === 'snapshot') {
    const session = sessionFromSnapshot(event.data, receivedAt);
    queryClient.setQueryData(queryKey, session);
    return isSessionOver(session) ? 'ended' : 'applied';
  }
  const current = queryClient.getQueryData(queryKey);
  if (current === undefined) {
    return 'resync';
  }
  switch (checkSeq(current.seq, event.data.seq)) {
    case 'duplicate':
      return 'skipped';
    case 'gap':
      return 'resync';
    case 'next': {
      const next = reduceSession(current, event, reduce);
      queryClient.setQueryData(queryKey, next);
      return isSessionOver(next) ? 'ended' : 'applied';
    }
  }
}

export interface SessionEventsParams {
  gameCode: RoomResponseGameCode;
  roomId: string;
  sessionId: string;
  /** Редьюсер игры партии (модули и события игры). */
  reduce: GameReducer;
}

/** Состояние, сообщённое потоком; `stream` — какой поток его сообщил. */
interface StreamState {
  stream: string;
  status: SessionEventsStatus;
}

/**
 * Поток событий партии: первым приходит снапшот для этого зрителя, дальше
 * события журнала с непрерывным seq. Партия хранится в кеше Query
 * (`useSession`). Дыра в seq или сообщение не по контракту — переподключение
 * за свежим снапшотом, повторы отбрасываются. Конец партии (в том числе
 * снапшот уже завершённой) закрывает поток.
 */
export function useSessionEvents({
  gameCode,
  roomId,
  sessionId,
  reduce,
}: SessionEventsParams): SessionEventsStatus {
  const queryClient = useQueryClient();
  const streamKey = `${gameCode}/${roomId}/${sessionId}`;
  const [state, setState] = useState<StreamState | null>(null);

  useEffect(() => {
    const url = sessionEventsUrl(gameCode, roomId, sessionId);
    const report = (status: SessionEventsStatus) => {
      setState({stream: streamKey, status});
    };
    let stream: EventStream | undefined;
    let resyncTimer: ReturnType<typeof setTimeout> | undefined;
    let resyncAttempt = 0;
    let stopped = false;

    const stop = () => {
      stopped = true;
      if (resyncTimer !== undefined) {
        clearTimeout(resyncTimer);
      }
      stream?.close();
      stream = undefined;
    };

    const resync = () => {
      stream?.close();
      stream = undefined;
      report('reconnecting');
      const delay =
        resyncAttempt === 0
          ? 0
          : Math.min(RESYNC_BASE_MS * 2 ** (resyncAttempt - 1), RESYNC_MAX_MS);
      resyncAttempt += 1;
      resyncTimer = setTimeout(open, delay);
    };

    function open(): void {
      resyncTimer = undefined;
      if (stopped) {
        return;
      }
      const current = createEventStream(url, {
        schema: SessionStreamEvent,
        types: SESSION_EVENT_TYPES,
        onOpen: () => {
          report('open');
        },
        onEvent: event => {
          // Сообщения закрытого потока (после сверки) уже не нужны.
          if (stream !== current) {
            return;
          }
          const result = applySessionEvent(
            queryClient,
            sessionId,
            event,
            reduce,
            Date.now(),
          );
          switch (result) {
            case 'applied':
              if (event.type !== 'snapshot') {
                resyncAttempt = 0;
              }
              return;
            case 'skipped':
              return;
            case 'resync':
              resync();
              return;
            case 'ended':
              stop();
              report('closed');
              return;
          }
        },
        onError: ({final}) => {
          report(final ? 'closed' : 'reconnecting');
        },
        onInvalid: () => {
          // Сообщение не по контракту пропущено — состояние могло разойтись.
          if (stream === current) {
            resync();
          }
        },
      });
      stream = current;
    }

    open();
    return stop;
  }, [gameCode, queryClient, reduce, roomId, sessionId, streamKey]);

  // Новый поток ещё ничего не сообщил — он подключается.
  return state?.stream === streamKey ? state.status : 'connecting';
}
