import {cn} from '@qgames/ui/lib/utils';
import {useEffect, useState} from 'react';

const TICK_MS = 250;
/** С этого остатка (в секундах) идущие часы подсвечиваются. */
const WARNING_SECONDS = 5;

/** Часы одного игрока (из блока `timer` состояния). */
export interface ClockState {
  /** Сохранённый запас, мс; у ходящего — на начало его хода. */
  remainingMs: number;
  /** Задержка, мс: тратится в начале хода раньше запаса; 0 — нет (инкремент сюда не входит). */
  delayMs: number;
  /**
   * Дедлайн по часам сервера (ISO 8601): начало хода + запас (+ задержка),
   * если часы идут у этого игрока; null — стоят.
   */
  deadline: string | null;
  /** На паузе отсчёт застывает на остатке `deadline − pausedAt`. */
  paused: boolean;
  /** Момент постановки на паузу по часам сервера (ISO 8601); null — часы идут. */
  pausedAt: string | null;
}

export interface ClockProps {
  clock: ClockState;
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

function toSeconds(ms: number): number {
  return Math.max(0, Math.ceil(ms / 1000));
}

/**
 * Часы игрока: запас и, если есть задержка, вторая зона справа. У
 * ходящего сначала до нуля идёт задержка, затем запас; у остальных —
 * застывший запас и полная задержка.
 */
export function Clock({clock, clockOffsetMs, className}: ClockProps) {
  const {remainingMs, delayMs, deadline, paused, pausedAt} = clock;
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

  let baseMs = remainingMs;
  let moveMs = delayMs;
  if (running) {
    const deadlineMs = Date.parse(deadline);
    // На паузе без момента паузы отсчёт застывает на последнем показанном значении.
    const serverNowMs =
      paused && pausedAt !== null ? Date.parse(pausedAt) : now + clockOffsetMs;
    if (!Number.isNaN(deadlineMs) && !Number.isNaN(serverNowMs)) {
      const leftMs = Math.max(0, deadlineMs - serverNowMs);
      baseMs = Math.min(remainingMs, leftMs);
      moveMs = Math.min(delayMs, leftMs - baseMs);
    }
  }
  const baseSeconds = toSeconds(baseMs);
  const moveSeconds = toSeconds(moveMs);
  const ticking = running && !paused;
  const warning = ticking && baseSeconds + moveSeconds <= WARNING_SECONDS;
  // Идёт зона времени на ход, пока в ней что-то есть, затем — запас.
  const moveActive = running && moveSeconds > 0;
  return (
    <span
      role="timer"
      aria-label={paused ? 'Осталось времени (пауза)' : 'Осталось времени'}
      className={cn(
        'inline-flex items-center rounded-md border font-mono tabular-nums',
        !running && 'text-muted-foreground',
        ticking && 'border-primary',
        warning && 'border-destructive text-destructive',
        className,
      )}
    >
      <span
        className={cn(
          'px-2 py-0.5',
          moveActive && !warning && 'text-muted-foreground',
        )}
      >
        {formatRemaining(baseSeconds)}
      </span>
      {delayMs > 0 ? (
        <span
          aria-label="Задержка"
          className={cn(
            'border-l border-inherit px-2 py-0.5',
            !moveActive && !warning && 'text-muted-foreground',
          )}
        >
          {formatRemaining(moveSeconds)}
        </span>
      ) : null}
    </span>
  );
}
