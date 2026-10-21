import {useMakeMove} from '@qgames/api/gateway';
import type {MoveRequest} from '@qgames/api/gateway/model';

import type {GameMove} from '@/entities/game';
import {roomErrorMessage, type RoomView} from '@/entities/room';
import {useSessionAdvance} from '@/entities/session';

export interface MoveControls {
  onMove: (move: GameMove) => void;
  movePending: boolean;
  moveError: string | null;
}

/**
 * Отправка хода (`{type, data}`). Ответ без тела: ход, очерёдность, варианты
 * ходов и таймер приходят событиями потока партии. Ошибки — по `code`
 * (`SESSION_PAUSED`, `MOVE_REJECTED` и др.). После 204 ход считается
 * отправляемым, пока событие потока не сдвинет seq партии: иначе кнопка
 * ненадолго оживает и повторный клик получает `NOT_YOUR_TURN`.
 */
export function useMoveControls(room: RoomView): MoveControls {
  const advance = useSessionAdvance(room.session?.id ?? null);
  const makeMove = useMakeMove({
    mutation: {
      onSuccess: () => {
        advance.arm();
      },
      onError: () => {
        advance.clear();
      },
    },
  });
  return {
    onMove: move => {
      const request: MoveRequest = {type: move.type};
      if (move.data !== undefined) {
        request.data = {...move.data};
      }
      advance.mark();
      makeMove.mutate({
        gameCode: room.gameCode,
        roomId: room.id,
        data: request,
      });
    },
    movePending: makeMove.isPending || advance.waiting,
    moveError: makeMove.isError ? roomErrorMessage(makeMove.error) : null,
  };
}
