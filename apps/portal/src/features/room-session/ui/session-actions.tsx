import {
  useCancelSession,
  usePauseSession,
  useResumeSession,
  useStartSession,
} from '@qgames/api/portal';
import type {RoomResponse} from '@qgames/api/portal/model';
import {activeTimer} from '@qgames/game-core';
import {Button} from '@qgames/ui/components/button';
import {useQueryClient} from '@tanstack/react-query';

import {
  roomErrorMessage,
  setRoomCache,
  type Membership,
  type RoomView,
} from '@/entities/room';
import {useSession, useSessionAdvance} from '@/entities/session';
import {WithHint} from '@/shared/ui';

export interface SessionActionsProps {
  room: RoomView;
  membership: Membership;
}

/**
 * Старт, пауза и отмена партии; доступны только владельцу. Старт возвращает
 * комнату (кладём в кеш); пауза, продолжение и отмена отвечают без тела —
 * изменения приходят потоками партии и комнаты. Пауза — действие таймера:
 * у партии без таймера её нет.
 */
export function SessionActions({room, membership}: SessionActionsProps) {
  const queryClient = useQueryClient();
  const start = useStartSession({
    mutation: {
      onSuccess: (data: RoomResponse) => {
        setRoomCache(queryClient, room.id, data);
      },
    },
  });
  const sessionId = room.session?.id ?? null;
  const session = useSession(sessionId);
  // Пауза и продолжение отвечают 204: ждём game-paused или game-resumed (рост seq).
  const advance = useSessionAdvance(sessionId);
  const onTimerAction = {
    mutation: {
      onSuccess: () => {
        advance.arm();
      },
      onError: () => {
        advance.clear();
      },
    },
  };
  const cancel = useCancelSession();
  const pause = usePauseSession(onTimerAction);
  const resume = useResumeSession(onTimerAction);
  if (!membership.isOwner) {
    return null;
  }
  const timer = session === undefined ? null : activeTimer(session);
  const error = start.error ?? cancel.error ?? pause.error ?? resume.error;
  const pending =
    start.isPending ||
    cancel.isPending ||
    pause.isPending ||
    resume.isPending ||
    advance.waiting;

  return (
    <>
      {membership.inGame ? (
        <>
          {timer === null ? null : timer.paused ? (
            <Button
              disabled={pending}
              onClick={() => {
                advance.mark();
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
                advance.mark();
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
