import {
  useCancelSession,
  usePauseSession,
  useResumeSession,
  useStartSession,
} from '@qgames/api/portal';
import type {RoomResponse} from '@qgames/api/portal/model';
import {activeTimer} from '@qgames/game-core';
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
import {useQueryClient} from '@tanstack/react-query';

import {
  roomErrorMessage,
  setRoomCache,
  type Membership,
  type RoomView,
} from '@/entities/room';
import {useSession, useSessionAdvance} from '@/entities/session';
import {WithHint} from '@/shared/ui';

import {testIds} from './session-actions.test-ids';

export interface SessionActionsProps {
  room: RoomView;
  membership: Membership;
}

function showError(error: unknown) {
  toast.error(roomErrorMessage(error));
}

/**
 * Старт, пауза и отмена партии; доступны только владельцу. Старт возвращает
 * комнату (кладём в кеш); пауза, продолжение и отмена отвечают без тела —
 * изменения приходят потоками партии и комнаты. Пауза — действие таймера:
 * у партии без таймера её нет. Отмена необратима — через окно подтверждения.
 * Ошибки действий показываются снекбаром.
 */
export function SessionActions({room, membership}: SessionActionsProps) {
  const queryClient = useQueryClient();
  const start = useStartSession({
    mutation: {
      onSuccess: (data: RoomResponse) => {
        setRoomCache(queryClient, room.id, data);
      },
      onError: showError,
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
      onError: (error: unknown) => {
        advance.clear();
        showError(error);
      },
    },
  };
  const cancel = useCancelSession({mutation: {onError: showError}});
  const pause = usePauseSession(onTimerAction);
  const resume = useResumeSession(onTimerAction);
  if (!membership.isOwner) {
    return null;
  }
  const timer = session === undefined ? null : activeTimer(session);
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
              data-testid={testIds.resumeButton}
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
              data-testid={testIds.pauseButton}
              disabled={pending}
              onClick={() => {
                advance.mark();
                pause.mutate({roomId: room.id});
              }}
            >
              Пауза
            </Button>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                data-testid={testIds.cancelButton}
                disabled={pending}
              >
                Отменить партию
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Отменить партию?</DialogTitle>
                <DialogDescription>
                  Партия закончится без результата, вернуть её будет нельзя.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Продолжить игру
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    data-testid={testIds.cancelConfirmButton}
                    onClick={() => {
                      cancel.mutate({roomId: room.id});
                    }}
                  >
                    Отменить партию
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
            data-testid={testIds.startButton}
            disabled={pending || !membership.enoughPlayers}
            onClick={() => {
              start.mutate({roomId: room.id});
            }}
          >
            Начать
          </Button>
        </WithHint>
      )}
    </>
  );
}
