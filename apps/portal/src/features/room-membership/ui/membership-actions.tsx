import {useChangeRole, useJoinRoom, useLeaveRoom} from '@qgames/api/gateway';
import type {RoomResponse} from '@qgames/api/gateway/model';
import {Button} from '@qgames/ui/components/button';
import {useQueryClient} from '@tanstack/react-query';

import {
  invalidateRoom,
  roomErrorMessage,
  setRoomCache,
  type Membership,
  type RoomView,
} from '@/entities/room';

export interface MembershipActionsProps {
  room: RoomView;
  membership: Membership;
}

/** Вход и выход из комнаты, смена роли «игрок ↔ наблюдатель». */
export function MembershipActions({room, membership}: MembershipActionsProps) {
  const queryClient = useQueryClient();
  const onRoom = {
    mutation: {
      onSuccess: (data: RoomResponse) => {
        setRoomCache(queryClient, room.id, data);
      },
    },
  };
  const join = useJoinRoom(onRoom);
  const changeRole = useChangeRole(onRoom);
  const leave = useLeaveRoom({
    mutation: {
      onSuccess: () => invalidateRoom(queryClient, room.id),
    },
  });
  const error = join.error ?? changeRole.error ?? leave.error;
  const pending = join.isPending || changeRole.isPending || leave.isPending;
  const {member} = membership;
  // Роль меняется только между партиями (ROOM_NOT_WAITING).
  const canChangeRole = member !== null && !membership.inGame;

  return (
    <>
      {member === null ? (
        <Button
          disabled={pending}
          onClick={() => {
            join.mutate({roomId: room.id});
          }}
        >
          Войти в комнату
        </Button>
      ) : (
        <>
          {canChangeRole && member.role === 'SPECTATOR' ? (
            <Button
              variant="outline"
              disabled={pending || !membership.hasFreeSeat}
              onClick={() => {
                changeRole.mutate({roomId: room.id, data: {role: 'PLAYER'}});
              }}
            >
              Стать игроком
            </Button>
          ) : null}
          {canChangeRole && member.role === 'PLAYER' ? (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => {
                changeRole.mutate({roomId: room.id, data: {role: 'SPECTATOR'}});
              }}
            >
              Стать наблюдателем
            </Button>
          ) : null}
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => {
              leave.mutate({roomId: room.id});
            }}
          >
            Выйти из комнаты
          </Button>
        </>
      )}
      {error === null ? null : (
        <p className="w-full text-sm text-destructive" role="alert">
          {roomErrorMessage(error)}
        </p>
      )}
    </>
  );
}
