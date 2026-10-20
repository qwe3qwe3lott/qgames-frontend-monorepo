import {cn} from '@qgames/ui/lib/utils';
import {useEffect, useState} from 'react';

const TICK_MS = 250;
/** С этого остатка (в секундах) отсчёт подсвечивается. */
const WARNING_SECONDS = 5;

export interface TurnTimerProps {
  /** Дедлайн хода по часам сервера (ISO 8601). */
  deadline: string;
  /** Смещение часов: время сервера минус `Date.now()` клиента, мс. */
  clockOffsetMs: number;
  /**
   * Момент постановки партии на паузу по часам сервера (ISO 8601); на паузе
   * отсчёт застывает на остатке `deadline − pausedAt`. null — паузы нет.
   */
  pausedAt?: string | null;
  className?: string;
}

function formatRemaining(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes)}:${String(seconds).padStart(2, '0')}`;
}

/** Обратный отсчёт до конца хода; на паузе — застывший остаток. */
export function TurnTimer({
  deadline,
  clockOffsetMs,
  pausedAt = null,
  className,
}: TurnTimerProps) {
  const paused = pausedAt !== null;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (paused) {
      return undefined;
    }
    const timer = setInterval(() => {
      setNow(Date.now());
    }, TICK_MS);
    return () => {
      clearInterval(timer);
    };
  }, [paused]);

  const deadlineMs = Date.parse(deadline);
  const serverNowMs = paused ? Date.parse(pausedAt) : now + clockOffsetMs;
  if (Number.isNaN(deadlineMs) || Number.isNaN(serverNowMs)) {
    return null;
  }
  const remainingSeconds = Math.max(
    0,
    Math.ceil((deadlineMs - serverNowMs) / 1000),
  );
  return (
    <span
      role="timer"
      aria-label={
        paused ? 'Осталось времени на ход (пауза)' : 'Осталось времени на ход'
      }
      className={cn(
        'rounded-md border px-2 py-1 font-mono text-lg tabular-nums',
        paused && 'text-muted-foreground',
        !paused &&
          remainingSeconds <= WARNING_SECONDS &&
          'border-destructive text-destructive',
        className,
      )}
    >
      {formatRemaining(remainingSeconds)}
    </span>
  );
}
