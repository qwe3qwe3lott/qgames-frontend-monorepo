import {isApiError} from '@qgames/api';
import {useMakeMove} from '@qgames/api/gateway';
import type {MoveRequest} from '@qgames/api/gateway/model';
import {useQueryClient} from '@tanstack/react-query';

import type {GameApi, GameMove} from '@/entities/game';
import {
  invalidateRoom,
  roomErrorMessage,
  setRoomCache,
  type RoomView,
} from '@/entities/room';

export interface MoveControls {
  onMove: (move: GameMove) => void;
  movePending: boolean;
  moveError: string | null;
}

/**
 * Отправка хода (`{type, data}`) с версией партии, которую видел клиент.
 * Если партия уже изменилась (SESSION_CONFLICT) или стоит на паузе
 * (SESSION_PAUSED), комната перечитывается.
 */
export function useMoveControls(game: GameApi, room: RoomView): MoveControls {
  const queryClient = useQueryClient();
  const makeMove = useMakeMove({
    mutation: {
      onSuccess: data => {
        setRoomCache(queryClient, room.id, data);
      },
      onError: error => {
        if (
          isApiError(error) &&
          (error.code === 'SESSION_CONFLICT' || error.code === 'SESSION_PAUSED')
        ) {
          void invalidateRoom(queryClient, room.id);
        }
      },
    },
  });
  return {
    onMove: move => {
      const request: MoveRequest = {type: move.type};
      if (move.data !== undefined) {
        request.data = {...move.data};
      }
      if (room.session !== null) {
        request.expectedVersion = room.session.version;
      }
      makeMove.mutate({
        gameCode: game.gameCode,
        roomId: room.id,
        data: request,
      });
    },
    movePending: makeMove.isPending,
    moveError: makeMove.isError ? roomErrorMessage(makeMove.error) : null,
  };
}
