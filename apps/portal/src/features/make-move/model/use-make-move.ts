import {isApiError} from '@qgames/api';
import {useMakeMove} from '@qgames/api/gateway';
import {useQueryClient} from '@tanstack/react-query';

import {
  invalidateRoom,
  roomErrorMessage,
  setRoomCache,
  type RoomView,
} from '@/entities/room';

export interface MoveControls {
  onMove: (move: Readonly<Record<string, unknown>>) => void;
  movePending: boolean;
  moveError: string | null;
}

/**
 * Отправка хода с версией партии, которую видел клиент. Если партия уже
 * изменилась (SESSION_CONFLICT), комната перечитывается.
 */
export function useMoveControls(room: RoomView): MoveControls {
  const queryClient = useQueryClient();
  const makeMove = useMakeMove({
    mutation: {
      onSuccess: data => {
        setRoomCache(queryClient, room.id, data);
      },
      onError: error => {
        if (isApiError(error) && error.code === 'SESSION_CONFLICT') {
          void invalidateRoom(queryClient, room.id);
        }
      },
    },
  });
  return {
    onMove: move => {
      const expectedVersion = room.session?.version;
      makeMove.mutate({
        roomId: room.id,
        data:
          expectedVersion === undefined
            ? {move: {...move}}
            : {move: {...move}, expectedVersion},
      });
    },
    movePending: makeMove.isPending,
    moveError: makeMove.isError ? roomErrorMessage(makeMove.error) : null,
  };
}
