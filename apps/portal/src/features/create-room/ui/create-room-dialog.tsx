import {useCreateRoom} from '@qgames/api/gateway';
import {Button} from '@qgames/ui/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@qgames/ui/components/dialog';
import {useQueryClient} from '@tanstack/react-query';
import {useNavigate} from '@tanstack/react-router';

import type {GameInfo} from '@/entities/game';
import {roomErrorMessage, setRoomCache} from '@/entities/room';

export interface CreateRoomDialogProps {
  game: GameInfo;
}

/**
 * Создание комнаты. Контракт принимает только тип игры; видимость, число игроков
 * и настройки — когда появятся на бэкенде (CLAUDE.md §4).
 */
export function CreateRoomDialog({game}: CreateRoomDialogProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const createRoom = useCreateRoom({
    mutation: {
      onSuccess: room => {
        setRoomCache(queryClient, room.id, room);
        void navigate({
          to: '/games/$gameCode/rooms/$roomId',
          params: {gameCode: game.code, roomId: room.id},
        });
      },
    },
  });
  const gameType = game.api?.gameType ?? null;

  return (
    <Dialog
      onOpenChange={open => {
        if (!open) {
          createRoom.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>Создать комнату</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новая комната: {game.title}</DialogTitle>
          <DialogDescription>{game.description}</DialogDescription>
        </DialogHeader>
        <p className="text-sm">
          {game.playersLabel}. Вы станете владельцем комнаты и первым игроком —
          отправьте ссылку на комнату друзьям.
        </p>
        {gameType === null ? (
          <p className="text-sm text-muted-foreground">
            Игра ещё в разработке — создать комнату пока нельзя.
          </p>
        ) : null}
        {createRoom.isError ? (
          <p className="text-sm text-destructive" role="alert">
            {roomErrorMessage(createRoom.error)}
          </p>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Отмена</Button>
          </DialogClose>
          <Button
            disabled={gameType === null || createRoom.isPending}
            onClick={() => {
              if (gameType !== null) {
                createRoom.mutate({data: {gameType}});
              }
            }}
          >
            Создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
