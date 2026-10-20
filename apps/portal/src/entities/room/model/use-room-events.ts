import {resolveUrl} from '@qgames/api';
import {getGetRoomQueryKey} from '@qgames/api/gateway';
import type {RoomResponse} from '@qgames/api/gateway/model';
import {
  RoomStreamEvent,
  type RoomStreamEventOutput,
} from '@qgames/api/gateway/zod';
import {useQueryClient, type QueryClient} from '@tanstack/react-query';
import {useCallback, useEffect, useState} from 'react';

import {createEventStream} from '@/shared/lib';

import {invalidateRoom} from '../lib/cache';
import {
  memberFromStream,
  roomFromStream,
  settingsFromStream,
} from '../lib/stream-data';

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
 * Состояние потока комнаты: `connecting` — первое подключение, `open` — поток
 * идёт, `reconnecting` — связь потеряна, идёт переподключение, `closed` —
 * поток закрыт насовсем (комната удалена, сессию не обновить или поток
 * выключен).
 */
export type RoomEventsStatus =
  'connecting' | 'open' | 'reconnecting' | 'closed';

export interface RoomEvents {
  status: RoomEventsStatus;
  /** Закрыть поток и открыть заново (например, после возврата из bfcache). */
  reconnect: () => void;
}

/**
 * Частичное событие (участники, настройки) меняет кеш, не сдвигая момент
 * получения данных: по нему и `serverTime` считается смещение часов.
 */
function patchRoom(
  queryClient: QueryClient,
  roomId: string,
  patch: (room: RoomResponse) => RoomResponse,
): void {
  const queryKey = getGetRoomQueryKey(roomId);
  const updatedAt = queryClient.getQueryState(queryKey)?.dataUpdatedAt;
  queryClient.setQueryData<RoomResponse>(
    queryKey,
    room => (room === undefined ? undefined : patch(room)),
    updatedAt === undefined ? undefined : {updatedAt},
  );
}

/**
 * Применяет событие к кешу `GET /api/rooms/{roomId}`. События несут полное
 * значение, поэтому повтор безопасен. Возвращает false, если поток дальше не
 * нужен.
 */
function applyRoomEvent(
  queryClient: QueryClient,
  roomId: string,
  event: RoomStreamEventOutput,
): boolean {
  switch (event.type) {
    case 'snapshot':
      queryClient.setQueryData<RoomResponse>(
        getGetRoomQueryKey(roomId),
        roomFromStream(event.data),
      );
      return true;
    case 'users-changed': {
      const {ownerId, members} = event.data;
      patchRoom(queryClient, roomId, room => ({
        ...room,
        ownerId: ownerId ?? null,
        members: members.map(memberFromStream),
      }));
      return true;
    }
    case 'settings-changed': {
      const {settings} = event.data;
      patchRoom(queryClient, roomId, room => ({
        ...room,
        settings: settingsFromStream(settings),
      }));
      return true;
    }
    case 'session-changed':
      void invalidateRoom(queryClient, roomId);
      return true;
    case 'room-deleted':
      // Перечитанная комната ответит ROOM_NOT_FOUND — страница покажет ошибку.
      void invalidateRoom(queryClient, roomId);
      return false;
  }
}

/** Состояние, сообщённое потоком; `stream` — какой поток его сообщил. */
interface StreamState {
  stream: string;
  status: RoomEventsStatus;
}

/**
 * Поток событий комнаты (`GET /api/rooms/{roomId}/events`): держит кеш комнаты
 * актуальным. Пока поток открыт, пользователь находится в комнате.
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
    const report = (status: RoomEventsStatus) => {
      setState({stream: streamKey, status});
    };
    const stream = createEventStream(roomEventsUrl(roomId), {
      schema: RoomStreamEvent,
      types: ROOM_EVENT_TYPES,
      onOpen: () => {
        report('open');
      },
      onEvent: event => {
        if (!applyRoomEvent(queryClient, roomId, event)) {
          stream.close();
          report('closed');
        }
      },
      onError: ({closed, final}) => {
        report(final ? 'closed' : 'reconnecting');
        // Поток закрыт ответом сервера (401, 404, 503): перечитанная комната
        // покажет причину, а если комнаты нет — страница выключит поток.
        if (closed) {
          void invalidateRoom(queryClient, roomId);
        }
      },
      onInvalid: () => {
        // Сообщение не по контракту — пропускаем и сверяемся с сервером.
        void invalidateRoom(queryClient, roomId);
      },
    });
    return () => {
      stream.close();
    };
  }, [enabled, queryClient, roomId, streamKey]);

  let status: RoomEventsStatus = 'closed';
  if (enabled) {
    // Новый поток ещё ничего не сообщил — он подключается.
    status = state?.stream === streamKey ? state.status : 'connecting';
  }
  return {status, reconnect};
}
