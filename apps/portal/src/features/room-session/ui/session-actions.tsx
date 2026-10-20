import {
  useCancelSession,
  usePauseSession,
  useResumeSession,
  useStartSession,
} from '@qgames/api/gateway';
import type {RoomResponse} from '@qgames/api/gateway/model';
import {Button} from '@qgames/ui/components/button';
import {useQueryClient} from '@tanstack/react-query';

import {
  roomErrorMessage,
  setRoomCache,
  type Membership,
  type RoomView,
} from '@/entities/room';
import {WithHint} from '@/shared/ui';

export interface SessionActionsProps {
  room: RoomView;
  membership: Membership;
}

/** Старт, пауза и отмена партии; доступны только владельцу. */
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
  const pause = usePauseSession(onRoom);
  const resume = useResumeSession(onRoom);
  if (!membership.isOwner) {
    return null;
  }
  const error = start.error ?? cancel.error ?? pause.error ?? resume.error;
  const pending =
    start.isPending || cancel.isPending || pause.isPending || resume.isPending;

  return (
    <>
      {membership.inGame ? (
        <>
          {membership.paused ? (
            <Button
              disabled={pending}
              onClick={() => {
                resume.mutate({roomId: room.id});
              }}
            >
              Продолжить
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => {
                pause.mutate({roomId: room.id});
              }}
            >
              Пауза
            </Button>
          )}
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => {
              cancel.mutate({roomId: room.id});
            }}
          >
            Отменить партию
          </Button>
        </>
      ) : (
        <WithHint
          hint={
            membership.enoughPlayers
              ? null
              : `Нужно игроков: ${String(room.minPlayers)}–${String(room.maxPlayers)}`
          }
        >
          <Button
            disabled={pending || !membership.enoughPlayers}
            onClick={() => {
              start.mutate({roomId: room.id});
            }}
          >
            Начать
          </Button>
        </WithHint>
      )}
      {error === null ? null : (
        <p className="w-full text-sm text-destructive" role="alert">
          {roomErrorMessage(error)}
        </p>
      )}
    </>
  );
}
