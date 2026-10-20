import {leaveRoom, useJoinRoom} from '@qgames/api/gateway';
import {useQueryClient, type QueryClient} from '@tanstack/react-query';
import {useEffect} from 'react';

import {invalidateRoom, setRoomCache} from '@/entities/room';

/**
 * Отложенные выходы по комнатам. Выход при unmount откладывается на тик: в
 * StrictMode (dev) эффект сразу монтируется повторно и отменяет выход, а не
 * выходит и входит заново.
 */
const pendingLeaves = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Выход через `keepalive`: запрос доживает до ответа, даже если вкладка
 * закрывается. Ошибки (комната удалена, пользователь уже не участник) не важны.
 */
function sendLeave(queryClient: QueryClient, roomId: string): void {
  void leaveRoom(roomId, {keepalive: true}).then(
    () => invalidateRoom(queryClient, roomId),
    () => undefined,
  );
}

export interface RoomPresence {
  /** Ошибка автовхода; null — вход удался или ещё не нужен. */
  joinError: unknown;
  retryJoin: () => void;
  joinPending: boolean;
}

/**
 * Присутствие в комнате, пока открыта её страница: вход при открытии и каждый
 * раз, когда пользователь не участник или помечен уходящим (повторный вход
 * идемпотентен и отменяет отложенный выход), и выход при уходе со страницы
 * (переход внутри SPA, закрытие вкладки, уход в bfcache).
 *
 * @param needsJoin пользователь не участник или уходящий; null — комната ещё
 *   не загружена.
 */
export function useRoomPresence(
  roomId: string,
  needsJoin: boolean | null,
): RoomPresence {
  const queryClient = useQueryClient();
  const join = useJoinRoom({
    mutation: {
      onSuccess: room => {
        setRoomCache(queryClient, roomId, room);
      },
    },
  });
  const {mutate, isPending, status} = join;

  // Вход при открытии страницы — всегда: после F5 или быстрого возврата
  // пользователь ещё числится участником, но выход уже отложен.
  useEffect(() => {
    mutate({roomId});
  }, [mutate, roomId]);

  // Повторный вход, если опрос показал, что пользователь не участник или уходит.
  // Только после удачного входа: пока первый вход идёт, он сам всё исправит,
  // а после ошибки вход не повторяется, чтобы не зациклиться на опросе
  // (есть «Повторить»).
  useEffect(() => {
    if (needsJoin === true && status === 'success') {
      mutate({roomId});
    }
  }, [needsJoin, status, mutate, roomId]);

  // Автовыход.
  useEffect(() => {
    const pending = pendingLeaves.get(roomId);
    if (pending !== undefined) {
      clearTimeout(pending);
      pendingLeaves.delete(roomId);
    }
    const onPageHide = () => {
      sendLeave(queryClient, roomId);
    };
    // Страница вернулась из bfcache: перечитываем комнату, автовход войдёт снова.
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void invalidateRoom(queryClient, roomId);
      }
    };
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
      pendingLeaves.set(
        roomId,
        setTimeout(() => {
          pendingLeaves.delete(roomId);
          sendLeave(queryClient, roomId);
        }, 0),
      );
    };
  }, [queryClient, roomId]);

  return {
    joinError: join.error,
    retryJoin: () => {
      mutate({roomId});
    },
    joinPending: isPending,
  };
}
