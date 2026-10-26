import {
  SessionTimerDto,
  type SessionTimerDtoOutput,
} from '@qgames/api/portal/zod';

import type {SessionData, SessionState} from '../session';
import type {SessionModule} from './module';

/** Шахматные часы партии (модуль timer); пауза — их состояние. */
export type SessionTimer = SessionTimerDtoOutput;

/** Блок модуля timer в состоянии игры; null — партия без таймера. */
export interface TimerBlock {
  timer?: SessionTimer | null | undefined;
}

const TimerSchema = SessionTimerDto.nullish();

/** Блок timer по схеме контракта; нет блока или null — партия без таймера. */
export function isTimerBlock(
  state: SessionState,
): state is SessionState & TimerBlock {
  return TimerSchema.safeParse(state['timer']).success;
}

/** Модуль timer: шахматные часы и пауза. Игра без таймера его не объявляет. */
export const timerModule: SessionModule = {
  name: 'timer',
  isBlock: isTimerBlock,
};

/** Часы идущей партии в виде для UI. */
export interface ActiveTimer {
  paused: boolean;
  /** Когда кончится запас ходящего (ISO 8601, часы сервера); null — ход ничей. */
  deadline: string | null;
  /** С какого момента пауза (ISO 8601, часы сервера); null — таймер идёт. */
  pausedAt: string | null;
  /** Запас каждого игрока на момент последней смены хода, мс. */
  clocks: readonly {playerId: string; remainingMs: number}[];
  /** Добавка за ход в секундах; 0 — без добавки. */
  incrementSeconds: number;
}

/** Часы одного игрока для показа. */
export interface PlayerClock {
  /** Сохранённый запас, мс; у ходящего — на начало его хода. */
  remainingMs: number;
  /** Дедлайн, если часы идут у этого игрока (он ходит); иначе null. */
  deadline: string | null;
  paused: boolean;
  pausedAt: string | null;
}

/**
 * Часы, которые нужно показывать, — единственное место, где решается,
 * действуют ли они. null — партия без таймера (или блок не по схеме), часы
 * остановлены (STOPPED приходит перед концом и отменой партии) или партия уже
 * не идёт (на случай снапшота без остановленных часов).
 */
export function activeTimer(session: SessionData): ActiveTimer | null {
  if (session.status !== 'IN_PROGRESS') {
    return null;
  }
  const {state} = session;
  const timer = isTimerBlock(state) ? state.timer : null;
  if (timer === undefined || timer === null || timer.status === 'STOPPED') {
    return null;
  }
  return {
    paused: timer.status === 'PAUSED',
    deadline: timer.deadline ?? null,
    pausedAt: timer.pausedAt ?? null,
    clocks: timer.clocks,
    incrementSeconds:
      session.meta.game.rules.timeControl?.incrementSeconds ?? 0,
  };
}

/**
 * Часы игрока [playerId]: идут только у ходящего ([currentPlayerId]),
 * у остальных — застывший запас. null — у игрока нет часов.
 */
export function playerClock(
  timer: ActiveTimer,
  playerId: string,
  currentPlayerId: string | null,
): PlayerClock | null {
  const clock = timer.clocks.find(item => item.playerId === playerId);
  if (clock === undefined) {
    return null;
  }
  return {
    remainingMs: clock.remainingMs,
    deadline: playerId === currentPlayerId ? timer.deadline : null,
    paused: timer.paused,
    pausedAt: timer.pausedAt,
  };
}
