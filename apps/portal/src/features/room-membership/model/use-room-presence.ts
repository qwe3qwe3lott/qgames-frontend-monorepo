import {useEffect} from 'react';

import {useRoomEvents, type RoomEventsStatus} from '@/entities/room';

export interface RoomPresence {
  /** Состояние потока комнаты: пока он открыт, пользователь в комнате. */
  status: RoomEventsStatus;
}

/**
 * Присутствие в комнате, пока открыта её страница: открытый поток событий
 * комнаты и есть нахождение в ней. Подключение входит в комнату (в том числе
 * отменяет отложенный выход), закрытие последнего подключения пользователя —
 * отложенный выход на сервере. Явных входа и выхода нет.
 *
 * @param enabled false — поток не нужен (комнаты нет или она недоступна).
 */
export function useRoomPresence(
  roomId: string,
  enabled: boolean,
): RoomPresence {
  const {status, reconnect} = useRoomEvents(roomId, enabled);

  // Страница вернулась из bfcache: соединение там уже не живо — открываем
  // поток заново, снапшот обновит комнату.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        reconnect();
      }
    };
    window.addEventListener('pageshow', onPageShow);
    return () => {
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [reconnect]);

  return {status};
}
