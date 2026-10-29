import {useChangeRole} from '@qgames/api/portal';
import {Button} from '@qgames/ui/components/Button';
import {toast} from '@qgames/ui/components/Sonner';

import {
  roomErrorMessage,
  type Membership,
  type RoomRole,
  type RoomView,
} from '@/entities/room';
import {WithHint} from '@qgames/ui/components/WithHint';
import {testIds} from './ChangeRoleButton.testIds';

export interface ChangeRoleButtonProps {
  room: RoomView;
  membership: Membership;
  /** Роль списка, в заголовке которого стоит кнопка. */
  role: RoomRole;
}

/** Причина, по которой перейти в список нельзя; null — можно. */
function blockReason(membership: Membership, role: RoomRole): string | null {
  if (membership.inGame) {
    return 'Роль меняется только между партиями';
  }
  if (role === 'PLAYER' && !membership.hasFreeSeat) {
    return 'Свободных мест игрока нет';
  }
  if (role === 'SPECTATOR' && !membership.hasSpectatorSeat) {
    return 'Свободных мест наблюдателя нет';
  }
  return null;
}

/**
 * «Перейти» в заголовке списка, где пользователя сейчас нет: смена роли
 * «игрок ↔ наблюдатель». Недоступный переход — заблокированная кнопка с подсказкой.
 */
export function ChangeRoleButton({
  room,
  membership,
  role,
}: ChangeRoleButtonProps) {
  // Новая роль приходит событием role-changed потока комнаты.
  const changeRole = useChangeRole({
    mutation: {
      onError: error => {
        toast.error(roomErrorMessage(error));
      },
    },
  });
  const {member} = membership;
  if (member === null || member.role === role) {
    return null;
  }
  const reason = blockReason(membership, role);

  return (
    <WithHint hint={reason}>
      <Button
        size="sm"
        variant="outline"
        data-testid={testIds.root}
        data-role={role}
        disabled={reason !== null || changeRole.isPending}
        onClick={() => {
          changeRole.mutate({roomId: room.id, data: {role}});
        }}
      >
        Перейти
      </Button>
    </WithHint>
  );
}
