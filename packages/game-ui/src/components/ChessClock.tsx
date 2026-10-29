import {cn} from '@qgames/ui/lib/utils';
import {useEffect, useState} from 'react';

const TICK_MS = 250;
/** С этого остатка (в секундах) идущие часы подсвечиваются. */
const WARNING_SECONDS = 5;

/** Часы одного игрока (из блока `timer` состояния). */
export interface ChessClockState {
  /** Сохранённый запас, мс; у ходящего — на начало его хода. */
  remainingMs: number;
  /** Дедлайн по часам сервера (ISO 8601), если часы идут у этого игрока; null — стоят. */
  deadline: string | null;
  /** На паузе отсчёт застывает на остатке `deadline − pausedAt`. */
  paused: boolean;
  /** Момент постановки на паузу по часам сервера (ISO 8601); null — часы идут. */
  pausedAt: string | null;
}

export interface ChessClockProps {
  clock: ChessClockState;
  /** Смещение часов: время сервера минус `Date.now()` клиента, мс. */
  clockOffsetMs: number;
  className?: string;
}

/** «4:05», от часа — «1:20:00». */
function formatRemaining(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return hours > 0
    ? `${String(hours)}:${String(minutes).padStart(2, '0')}:${seconds}`
    : `${String(minutes)}:${seconds}`;
}

/** Добавка за ход «+5 с за ход»; без добавки (0) ничего не показывается. */
export function ClockIncrement({seconds}: {seconds: number}) {
  if (seconds <= 0) {
    return null;
  }
  return (
    <span className="text-sm text-muted-foreground">+{seconds} с за ход</span>
  );
}

/** Шахматные часы игрока: у ходящего — обратный отсчёт до дедлайна, у остальных — застывший запас. */
export function ChessClock({clock, clockOffsetMs, className}: ChessClockProps) {
  const {remainingMs, deadline, paused, pausedAt} = clock;
  const running = deadline !== null;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running || paused) {
      return undefined;
    }
    const interval = setInterval(() => {
      setNow(Date.now());
    }, TICK_MS);
    return () => {
      clearInterval(interval);
    };
  }, [running, paused]);

  let leftMs = remainingMs;
  if (running) {
    const deadlineMs = Date.parse(deadline);
    // На паузе без момента паузы отсчёт застывает на последнем показанном значении.
    const serverNowMs =
      paused && pausedAt !== null ? Date.parse(pausedAt) : now + clockOffsetMs;
    if (!Number.isNaN(deadlineMs) && !Number.isNaN(serverNowMs)) {
      leftMs = deadlineMs - serverNowMs;
    }
  }
  const leftSeconds = Math.max(0, Math.ceil(leftMs / 1000));
  return (
    <span
      role="timer"
      aria-label={paused ? 'Осталось времени (пауза)' : 'Осталось времени'}
      className={cn(
        'rounded-md border px-2 py-0.5 font-mono tabular-nums',
        !running && 'text-muted-foreground',
        running && !paused && 'border-primary',
        running &&
          !paused &&
          leftSeconds <= WARNING_SECONDS &&
          'border-destructive text-destructive',
        className,
      )}
    >
      {formatRemaining(leftSeconds)}
    </span>
  );
}
