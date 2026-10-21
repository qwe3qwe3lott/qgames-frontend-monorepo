import {cn} from '@qgames/ui/lib/utils';
import {useEffect, useState} from 'react';

const TICK_MS = 250;
/** С этого остатка (в секундах) отсчёт подсвечивается. */
const WARNING_SECONDS = 5;

/** Таймер хода партии (блок `timer` состояния). */
export interface TurnTimerState {
  /** На паузе отсчёт застывает на остатке `deadline − pausedAt`. */
  paused: boolean;
  /** Дедлайн хода по часам сервера (ISO 8601); null — ход ничей, отсчёта нет. */
  deadline: string | null;
  /** Момент постановки на паузу по часам сервера (ISO 8601); null — таймер идёт. */
  pausedAt: string | null;
}

export interface TurnTimerProps {
  timer: TurnTimerState;
  /** Смещение часов: время сервера минус `Date.now()` клиента, мс. */
  clockOffsetMs: number;
  className?: string;
}

function formatRemaining(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes)}:${String(seconds).padStart(2, '0')}`;
}

/** Обратный отсчёт до конца хода; на паузе — застывший остаток. */
export function TurnTimer({timer, clockOffsetMs, className}: TurnTimerProps) {
  const {paused, deadline, pausedAt} = timer;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (paused) {
      return undefined;
    }
    const interval = setInterval(() => {
      setNow(Date.now());
    }, TICK_MS);
    return () => {
      clearInterval(interval);
    };
  }, [paused]);

  if (deadline === null) {
    return null;
  }
  const deadlineMs = Date.parse(deadline);
  // На паузе без момента паузы отсчёт застывает на последнем показанном значении.
  const serverNowMs =
    paused && pausedAt !== null ? Date.parse(pausedAt) : now + clockOffsetMs;
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
