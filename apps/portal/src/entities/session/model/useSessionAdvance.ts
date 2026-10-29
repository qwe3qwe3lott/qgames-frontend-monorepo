import {useEffect, useState} from 'react';

import {useSession} from './useSession';

/**
 * Сколько ждать события потока после ответа 204. Повторная пауза или
 * продолжение отвечают 204 без события, а поток может оборваться — кнопка не
 * должна зависнуть.
 */
const ADVANCE_TIMEOUT_MS = 5000;

interface Mark {
  /** seq партии в кеше в момент отправки действия. */
  base: number;
  /** Ответ 204 получен: ждём роста seq. */
  armed: boolean;
  expired: boolean;
}

export interface SessionAdvance {
  /** Перед отправкой действия: запомнить текущий seq. */
  mark: () => void;
  /** Действие принято (204): ждать, пока seq в кеше не вырастет. */
  arm: () => void;
  /** Действие отклонено: не ждать. */
  clear: () => void;
  /** Ответ получен, но событие потока ещё не пришло. */
  waiting: boolean;
}

/**
 * Ожидание результата действия с партией в потоке: мутации хода, паузы и
 * продолжения отвечают 204, а состояние меняется событием с новым seq. Пока
 * его нет, кнопки остаются заблокированными (не больше `ADVANCE_TIMEOUT_MS`).
 */
export function useSessionAdvance(sessionId: string | null): SessionAdvance {
  const session = useSession(sessionId);
  const [mark, setMark] = useState<Mark | null>(null);
  const armed = mark?.armed === true && !mark.expired;

  useEffect(() => {
    if (!armed) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setMark(current =>
        current === null ? null : {...current, expired: true},
      );
    }, ADVANCE_TIMEOUT_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [armed]);

  const seq = session?.seq;
  return {
    mark: () => {
      setMark(
        seq === undefined ? null : {base: seq, armed: false, expired: false},
      );
    },
    arm: () => {
      setMark(current => (current === null ? null : {...current, armed: true}));
    },
    clear: () => {
      setMark(null);
    },
    waiting:
      armed && session?.status === 'IN_PROGRESS' && session.seq <= mark.base,
  };
}
