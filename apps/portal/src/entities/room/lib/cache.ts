import {getGetRoomQueryKey} from '@qgames/api/portal';
import type {QueryClient} from '@tanstack/react-query';

/**
 * Перечитать `GET` комнаты. Комнату на странице строит поток
 * (`['room-stream', roomId]`), а `GET` нужен для ошибок: после закрытия потока
 * сервером он показывает причину (комнаты нет, мест нет).
 */
export function invalidateRoom(
  queryClient: QueryClient,
  roomId: string,
): Promise<void> {
  return queryClient.invalidateQueries({queryKey: getGetRoomQueryKey(roomId)});
}
