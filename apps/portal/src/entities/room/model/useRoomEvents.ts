import {resolveUrl} from '@qgames/api';
import {RoomStreamEvent} from '@qgames/api/portal/zod';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {useCallback, useEffect, useState} from 'react';

import {createEventStream, type EventStream} from '@/shared/lib';

import {invalidateRoom} from '../lib/cache';
import {applyRoomStreamMessage, type RoomStreamData} from '../lib/roomStream';
import {roomStreamQueryOptions} from './query';

/**
 * Адрес потока `GET /api/rooms/{roomId}/events`. Клиент Orval для SSE-ручек не
 * генерируется (`packages/api/orval.config.ts`), поэтому путь собирается здесь.
 */
function roomEventsUrl(roomId: string): string {
  return resolveUrl(`/api/rooms/${encodeURIComponent(roomId)}/events`);
}

/** Типы событий потока — из схемы контракта, а не списком руками. */
const ROOM_EVENT_TYPES = RoomStreamEvent.options.flatMap(
  option => option.shape.type.options,
);

/**
 * Пауза перед повторной сверкой (дыра в seq или сообщение не по контракту):
 * первая — сразу, дальше удваивается, пока событие не применится.
 */
const RESYNC_BASE_MS = 1000;
const RESYNC_MAX_MS = 30_000;

/**
 * Состояние потока комнаты: `connecting` — первое подключение, `open` — поток
 * идёт, `reconnecting` — связь или события потеряны, идёт переподключение за
 * свежим снапшотом, `closed` — поток закрыт насовсем (комната удалена, сессию
 * не обновить или поток выключен).
 */
export type RoomEventsStatus =
  'connecting' | 'open' | 'reconnecting' | 'closed';

export interface RoomEvents {
  status: RoomEventsStatus;
  /** Закрыть поток и открыть заново (например, после возврата из bfcache). */
  reconnect: () => void;
}

/** Состояние, сообщённое потоком; `stream` — какой поток его сообщил. */
interface StreamState {
  stream: string;
  status: RoomEventsStatus;
}

/**
 * Поток событий комнаты (`GET /api/rooms/{roomId}/events`): строит комнату в
 * кеше `['room-stream', roomId]` — снапшот, затем патчи по порядку seq
 * (`applyRoomStreamMessage`). Дыра в seq или патч, который не применился, —
 * рассинхронизация: поток переоткрывается за свежим снапшотом. Пока поток
 * открыт, пользователь находится в комнате.
 *
 * `GET` комнаты (лоадер маршрута) нужен только для ошибок: когда поток закрыт
 * сервером (комнаты нет, мест нет, комната удалена), он перечитывается, и
 * страница показывает причину.
 *
 * @param enabled false — поток закрыт (и не открывается).
 */
export function useRoomEvents(roomId: string, enabled: boolean): RoomEvents {
  const queryClient = useQueryClient();
  // Смена номера переоткрывает поток.
  const [generation, setGeneration] = useState(0);
  const reconnect = useCallback(() => {
    setGeneration(value => value + 1);
  }, []);
  const streamKey = `${roomId}#${String(generation)}`;
  const [state, setState] = useState<StreamState | null>(null);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const {queryKey} = roomStreamQueryOptions(roomId);
    // Комната с прошлого визита устарела: до снапшота страница показывает
    // загрузку, а не прежних участников и партию. Переоткрытие при сверке кеш
    // не сбрасывает — снапшот заменит его сам.
    void queryClient.resetQueries({queryKey, exact: true});
    const url = roomEventsUrl(roomId);
    const report = (status: RoomEventsStatus) => {
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

    const resync = (reason: string) => {
      if (import.meta.env.DEV) {
        console.warn(`[room] рассинхронизация: ${reason}`);
      }
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
        schema: RoomStreamEvent,
        types: ROOM_EVENT_TYPES,
        onOpen: () => {
          report('open');
        },
        onEvent: message => {
          // Сообщения закрытого потока (после сверки) уже не нужны.
          if (stream !== current) {
            return;
          }
          const result = applyRoomStreamMessage(
            queryClient.getQueryData<RoomStreamData>(queryKey),
            message,
          );
          switch (result.type) {
            case 'applied':
              queryClient.setQueryData(queryKey, result.data);
              if (message.type !== 'snapshot') {
                resyncAttempt = 0;
              }
              return;
            case 'skipped':
              return;
            case 'resync':
              resync(result.reason);
              return;
            case 'ended':
              // Перечитанная комната ответит ROOM_NOT_FOUND — страница покажет
              // ошибку.
              stop();
              report('closed');
              void invalidateRoom(queryClient, roomId);
              return;
          }
        },
        onError: ({closed, final}) => {
          report(final ? 'closed' : 'reconnecting');
          // Поток закрыт ответом сервера (401, 404, 409): EventSource кода не
          // видит, перечитанная комната покажет причину.
          if (closed) {
            void invalidateRoom(queryClient, roomId);
          }
        },
        onInvalid: () => {
          // Сообщение не по контракту пропущено — комната могла разойтись.
          if (stream === current) {
            resync('сообщение не по контракту');
          }
        },
      });
      stream = current;
    }

    open();
    return stop;
  }, [enabled, queryClient, roomId, streamKey]);

  let status: RoomEventsStatus = 'closed';
  if (enabled) {
    // Новый поток ещё ничего не сообщил — он подключается.
    status = state?.stream === streamKey ? state.status : 'connecting';
  }
  return {status, reconnect};
}

/** Комната из потока; undefined — снапшота ещё не было. */
export function useRoomStream(roomId: string): RoomStreamData | undefined {
  return useQuery(roomStreamQueryOptions(roomId)).data;
}
