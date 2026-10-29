import {useTransferOwnership} from '@qgames/api/portal';
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
import {toast} from '@qgames/ui/components/sonner';

import {
  memberName,
  roomErrorMessage,
  type Membership,
  type RoomMemberView,
  type RoomView,
} from '@/entities/room';

export interface TransferOwnershipButtonProps {
  room: RoomView;
  membership: Membership;
  /** Участник, в строке которого стоит кнопка. */
  member: RoomMemberView;
}

/**
 * «Передать владение» в строке участника: только у владельца и только для
 * других присутствующих участников. Передача — через окно подтверждения,
 * ошибка — снекбаром.
 */
export function TransferOwnershipButton({
  room,
  membership,
  member,
}: TransferOwnershipButtonProps) {
  // Новый владелец приходит событием owner-changed потока комнаты.
  const transfer = useTransferOwnership({
    mutation: {
      onError: error => {
        toast.error(roomErrorMessage(error));
      },
    },
  });
  if (
    !membership.isOwner ||
    member.id === membership.member?.id ||
    member.leaving
  ) {
    return null;
  }
  const name = memberName(member);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" disabled={transfer.isPending}>
          Передать владение
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Передать владение комнатой?</DialogTitle>
          <DialogDescription>
            Владельцем станет {name}: начинать и отменять партии, ставить их на
            паузу и менять настройки комнаты будет новый владелец. Вы останетесь
            в комнате обычным участником и вернуть права сами не сможете.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Отмена
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              type="button"
              onClick={() => {
                transfer.mutate({
                  roomId: room.id,
                  data: {userId: member.id},
                });
              }}
            >
              Передать
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
