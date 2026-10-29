import {useCreateRoom} from '@qgames/api/portal';
import {Button} from '@qgames/ui/components/Button';
import {toast} from '@qgames/ui/components/Sonner';
import {useNavigate} from '@tanstack/react-router';

import {GAME_IN_DEVELOPMENT_HINT, type GameEntry} from '@/entities/game';
import {roomErrorMessage} from '@/entities/room';
import {WithHint} from '@qgames/ui/components/WithHint';

import {testIds} from './CreateRoomButton.testIds';

export interface CreateRoomButtonProps {
  game: GameEntry;
}

/**
 * Создание комнаты с настройками игры по умолчанию и переход в неё: создатель
 * входит первым — игроком и владельцем — и меняет настройки уже в комнате.
 */
export function CreateRoomButton({game}: CreateRoomButtonProps) {
  const navigate = useNavigate();
  const createRoom = useCreateRoom({
    mutation: {
      onSuccess: room => {
        void navigate({
          to: '/games/$gameCode/rooms/$roomId',
          params: {gameCode: game.code, roomId: room.id},
        });
      },
      onError: error => {
        toast.error(roomErrorMessage(error));
      },
    },
  });
  // Без пакета игры на фронте доску не нарисовать — комнату не создаём.
  const hint = game.load === undefined ? GAME_IN_DEVELOPMENT_HINT : null;
  return (
    <WithHint hint={hint}>
      <Button
        data-testid={testIds.root}
        disabled={hint !== null || createRoom.isPending}
        onClick={() => {
          createRoom.mutate({gameCode: game.code});
        }}
      >
        Создать комнату
      </Button>
    </WithHint>
  );
}
