import {
  SessionTimerDto,
  type SessionTimerDtoOutput,
} from '@qgames/api/gateway/zod';

import type {SessionData, SessionState} from '../session';
import type {SessionModule} from './module';

/** Таймер хода (модуль timer); пауза — его состояние. */
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

/** Модуль timer: время хода и пауза. Игра без таймера его не объявляет. */
export const timerModule: SessionModule = {
  name: 'timer',
  isBlock: isTimerBlock,
};

/** Таймер идущей партии в виде для UI. */
export interface ActiveTimer {
  paused: boolean;
  /** Когда истекает время хода (ISO 8601, часы сервера); null — ход ничей. */
  deadline: string | null;
  /** С какого момента пауза (ISO 8601, часы сервера); null — таймер идёт. */
  pausedAt: string | null;
}

/**
 * Таймер, который нужно показывать, — единственное место, где решается,
 * действует ли таймер. null — партия без таймера (или блок не по схеме),
 * таймер остановлен (STOPPED приходит перед концом и отменой партии) или
 * партия уже не идёт (на случай снапшота без остановленного таймера).
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
  };
}
