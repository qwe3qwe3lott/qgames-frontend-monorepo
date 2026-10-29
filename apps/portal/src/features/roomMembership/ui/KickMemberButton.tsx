import {useKickMember} from '@qgames/api/portal';
import {Button} from '@qgames/ui/components/Button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@qgames/ui/components/Dialog';
import {toast} from '@qgames/ui/components/Sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@qgames/ui/components/Tooltip';
import {UserX} from 'lucide-react';

import {
  memberName,
  roomErrorMessage,
  type Membership,
  type RoomMemberView,
  type RoomView,
} from '@/entities/room';

import {testIds} from './KickMemberButton.testIds';

export interface KickMemberButtonProps {
  room: RoomView;
  membership: Membership;
  /** Участник, в строке которого стоит кнопка. */
  member: RoomMemberView;
}

/**
 * «Исключить» в строке участника: только у владельца и только для других
 * присутствующих участников. Исключение — через окно подтверждения; игрока
 * идущей партии окно предупреждает, что партия идёт дальше с отсутствующим
 * игроком. Ошибка — снекбаром.
 */
export function KickMemberButton({
  room,
  membership,
  member,
}: KickMemberButtonProps) {
  // Уход участника приходит событиями member-kicked и member-left (или
  // member-leaving) потока комнаты.
  const kick = useKickMember({
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
  // Во время партии игроки комнаты — её игроки.
  const sessionPlayer = room.status === 'IN_GAME' && member.role === 'PLAYER';

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              data-testid={testIds.root}
              data-user-id={member.id}
              size="icon-sm"
              variant="ghost"
              aria-label="Исключить"
              disabled={kick.isPending}
            >
              <UserX />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Исключить</TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Исключить {name}?</DialogTitle>
          <DialogDescription>
            {name} покинет комнату. Это не блокировка: войти снова можно по
            ссылке на комнату.
          </DialogDescription>
        </DialogHeader>
        {sessionPlayer ? (
          <p className="text-sm text-destructive" role="alert">
            {name} играет в идущей партии. Место в партии сохранится, а время на
            ходы будет истекать по правилам игры; в партии без таймера ход не
            перейдёт, пока вы не отмените партию. Вернувшись до её конца, игрок
            продолжит играть.
          </p>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Отмена
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              data-testid={testIds.confirm}
              type="button"
              variant="destructive"
              onClick={() => {
                kick.mutate({roomId: room.id, userId: member.id});
              }}
            >
              Исключить
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
