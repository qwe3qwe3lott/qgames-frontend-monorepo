import {queryOptions, skipToken} from '@tanstack/react-query';

import type {RoomStreamData} from '../lib/room-stream';

/**
 * Комната из потока лежит в кеше Query под ключом `['room-stream', roomId]`.
 * Исключение из правила «ключи только из Orval» (CLAUDE.md §4), как у партии:
 * данные пишет только `useRoomEvents` (снапшот и патчи по seq), запроса нет
 * (`skipToken`). `GET` комнаты сюда не пишет — гонки ответа с событиями нет.
 */
export function roomStreamQueryOptions(roomId: string) {
  return queryOptions<RoomStreamData>({
    queryKey: ['room-stream', roomId],
    queryFn: skipToken,
    staleTime: Infinity,
  });
}
