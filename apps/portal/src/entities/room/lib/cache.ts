import {getGetRoomQueryKey} from '@qgames/api/portal';
import type {RoomResponse} from '@qgames/api/portal/model';
import type {QueryClient} from '@tanstack/react-query';

/** Ручки комнат возвращают новое состояние комнаты — кладём его в кеш без перезапроса. */
export function setRoomCache(
  queryClient: QueryClient,
  roomId: string,
  room: RoomResponse,
): void {
  queryClient.setQueryData(getGetRoomQueryKey(roomId), room);
}

export function invalidateRoom(
  queryClient: QueryClient,
  roomId: string,
): Promise<void> {
  return queryClient.invalidateQueries({queryKey: getGetRoomQueryKey(roomId)});
}
