import {useCancelSession, useStartSession} from '@qgames/api/gateway';
import type {RoomResponse} from '@qgames/api/gateway/model';
import {Button} from '@qgames/ui/components/button';
import {useQueryClient} from '@tanstack/react-query';

import {
  roomErrorMessage,
  setRoomCache,
  type Membership,
  type RoomView,
} from '@/entities/room';

export interface SessionActionsProps {
  room: RoomView;
  membership: Membership;
}

/** Старт и отмена партии; доступны только владельцу. */
export function SessionActions({room, membership}: SessionActionsProps) {
  const queryClient = useQueryClient();
  const onRoom = {
    mutation: {
      onSuccess: (data: RoomResponse) => {
        setRoomCache(queryClient, room.id, data);
      },
    },
  };
  const start = useStartSession(onRoom);
  const cancel = useCancelSession(onRoom);
  if (!membership.isOwner) {
    return null;
  }
  const error = start.error ?? cancel.error;
  const pending = start.isPending || cancel.isPending;

  return (
    <>
      {membership.inGame ? (
        <Button
          variant="destructive"
          disabled={pending}
          onClick={() => {
            cancel.mutate({roomId: room.id});
          }}
        >
          Отменить партию
        </Button>
      ) : (
        <Button
          disabled={pending || !membership.enoughPlayers}
          title={
            membership.enoughPlayers
              ? undefined
              : `Нужно игроков: ${String(room.minPlayers)}–${String(room.maxPlayers)}`
          }
          onClick={() => {
            start.mutate({roomId: room.id});
          }}
        >
          {room.session === null ? 'Начать партию' : 'Начать новую партию'}
        </Button>
      )}
      {error === null ? null : (
        <p className="w-full text-sm text-destructive" role="alert">
          {roomErrorMessage(error)}
        </p>
      )}
    </>
  );
}
