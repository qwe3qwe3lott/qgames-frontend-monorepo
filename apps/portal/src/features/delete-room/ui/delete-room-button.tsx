import {getGetRoomQueryKey, useDeleteRoom} from '@qgames/api/gateway';
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

import type {GameCode} from '@/entities/game';
import {
  roomErrorMessage,
  type Membership,
  type RoomView,
} from '@/entities/room';

export interface DeleteRoomButtonProps {
  room: RoomView;
  membership: Membership;
  gameCode: GameCode;
}

/** Удаление комнаты вместе с историей партий; только владелец, с подтверждением. */
export function DeleteRoomButton({
  room,
  membership,
  gameCode,
}: DeleteRoomButtonProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const deleteRoom = useDeleteRoom({
    mutation: {
      onSuccess: () => {
        queryClient.removeQueries({queryKey: getGetRoomQueryKey(room.id)});
        void navigate({to: '/games/$gameCode/rooms', params: {gameCode}});
      },
    },
  });
  if (!membership.isOwner) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-destructive">
          Удалить комнату
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Удалить комнату?</DialogTitle>
          <DialogDescription>
            Комната удалится вместе с историей партий. Отменить это нельзя.
          </DialogDescription>
        </DialogHeader>
        {deleteRoom.isError ? (
          <p className="text-sm text-destructive" role="alert">
            {roomErrorMessage(deleteRoom.error)}
          </p>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Отмена</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={deleteRoom.isPending}
            onClick={() => {
              deleteRoom.mutate({roomId: room.id});
            }}
          >
            Удалить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
