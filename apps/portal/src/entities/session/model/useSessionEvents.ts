import {isApiError, resolveUrl} from '@qgames/api';
import {getGetRoomQueryOptions} from '@qgames/api/portal';
import type {RoomResponseGameCode} from '@qgames/api/portal/model';
import {
  SessionStreamEvent,
  type SessionStreamEventOutput,
} from '@qgames/api/portal/zod';
import {
  applySessionEvent,
  checkSeq,
  checkSessionState,
  isSessionOver,
  parseSessionDocument,
  sessionFromSnapshot,
  type GameStateRules,
  type SessionLogEvent,
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
 * сессию не обновить), `denied` — сервер не пускает в партию (комнаты или
 * партии нет, пользователь больше не участник комнаты), попыток больше нет.
 */
export type SessionEventsStatus =
  'connecting' | 'open' | 'reconnecting' | 'closed' | 'denied';

/**
 * Итог применения сообщения: `applied` — кеш обновлён, `skipped` — повтор
 * (seq уже применён), `resync` — событие потеряно или не применилось
 * (рассинхронизация), нужен свежий снапшот, `ended` — партия закончилась,
 * поток больше не нужен.
 */
type ApplyResult = 'applied' | 'skipped' | 'resync' | 'ended';

/**
 * Отладочный лог событий журнала: `code` — что произошло. Состояние по нему
 * не меняется (только по `method`); журнал на экране — отдельная задача.
 */
function logSessionEvent(event: SessionLogEvent, error?: string): void {
  if (!import.meta.env.DEV) {
    return;
  }
  if (error === undefined) {
    console.debug(
      `[session] #${String(event.seq)} ${event.method} ${event.code}`,
      event.data,
    );
  } else {
    console.warn(
      `[session] #${String(event.seq)} не применилось: ${error}`,
      event.data,
    );
  }
}

/**
 * Партия игры этой комнаты: проверяется guard'ом core и guard'ом игровых
 * полей (`GameStateRules`).
 */
interface SessionGame {
  gameCode: RoomResponseGameCode;
  rules: GameStateRules;
}

/**
 * Применяет сообщение потока к партии в кеше Query: снапшот заменяет партию,
 * событие журнала применяется общим `applySessionEvent` (по `method`).
 * Снапшот и документ после каждого события проверяются: `status` и `meta` —
 * общей схемой контракта, код игры — по комнате, состояние — guard'ами core
 * и игровых полей. Событие, которое не применилось
 * или дало документ не по контракту, — рассинхронизация.
 */
function applyStreamMessage(
  queryClient: QueryClient,
  sessionId: string,
  game: SessionGame,
  event: SessionStreamEventOutput,
  receivedAt: number,
): ApplyResult {
  const {queryKey} = sessionStreamQueryOptions(sessionId);
  if (event.type === 'snapshot') {
    const session = sessionFromSnapshot(event.data, receivedAt);
    if (
      session.meta.game.code !== game.gameCode ||
      !checkSessionState(session.state, game.rules)
    ) {
      return 'resync';
    }
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
      const result = applySessionEvent(current, event.data);
      if (!result.ok) {
        logSessionEvent(event.data, result.error);
        return 'resync';
      }
      const document = parseSessionDocument(result.document, game.rules);
      if (document?.meta.game.code !== game.gameCode) {
        logSessionEvent(event.data, 'документ не по контракту');
        return 'resync';
      }
      logSessionEvent(event.data);
      const next = {...current, ...document, seq: event.data.seq};
      queryClient.setQueryData(queryKey, next);
      // Конец и отмена партии — патч статуса (`PATCH [] {status}`).
      return isSessionOver(next) ? 'ended' : 'applied';
    }
  }
}

export interface SessionEventsParams {
  gameCode: RoomResponseGameCode;
  roomId: string;
  sessionId: string;
  /** Пользователь страницы: участник ли он ещё комнаты. */
  viewerId: string;
  /** Что игра объявляет о состоянии: guard игровых полей. */
  rules: GameStateRules;
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
 *
 * Поток, закрытый сервером (ответ не 200 или поток завершён), `EventSource`
 * не объясняет: хук перечитывает `GET` комнаты. Комнаты нет (4xx), партия не
 * её или зритель больше не участник — попытки прекращаются (`denied`),
 * иначе обёртка переподключается как обычно.
 */
export function useSessionEvents({
  gameCode,
  roomId,
  sessionId,
  viewerId,
  rules,
}: SessionEventsParams): SessionEventsStatus {
  const queryClient = useQueryClient();
  const streamKey = `${gameCode}/${roomId}/${sessionId}/${viewerId}`;
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

    // Причина закрытия потока сервером — по перечитанной комнате.
    const verify = async () => {
      let denied = false;
      try {
        const room = await queryClient.query({
          ...getGetRoomQueryOptions(roomId),
          staleTime: 0,
        });
        denied =
          !room.members.some(member => member.id === viewerId) ||
          room.session?.id !== sessionId;
      } catch (error) {
        // Сеть и 5xx — не отказ: обёртка переподключается дальше.
        denied = isApiError(error) && error.status >= 400 && error.status < 500;
      }
      if (denied && !stopped) {
        stop();
        report('denied');
      }
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
          const result = applyStreamMessage(
            queryClient,
            sessionId,
            {gameCode, rules},
            event,
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
        onError: ({closed, final}) => {
          report(final ? 'closed' : 'reconnecting');
          if (closed && !final) {
            void verify();
          }
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
  }, [gameCode, queryClient, roomId, rules, sessionId, streamKey, viewerId]);

  // Новый поток ещё ничего не сообщил — он подключается.
  return state?.stream === streamKey ? state.status : 'connecting';
}
