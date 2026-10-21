import type {SessionTimerDtoOutput} from '@qgames/api/gateway/zod';

import type {SessionData, SessionLogEvent} from '../session';

/** Таймер хода (модуль timer); пауза — его состояние. */
export type SessionTimer = SessionTimerDtoOutput;

/** Блок модуля timer в состоянии игры; null — партия без таймера. */
export interface TimerBlock {
  timer?: SessionTimer | null | undefined;
}

/** Модуль timer: `timer-changed` заменяет таймер целиком (PUT), в том числе пауза и продолжение. */
export function reduceTimer<S extends TimerBlock>(
  state: S,
  event: SessionLogEvent,
): S {
  if (event.type !== 'timer-changed') {
    return state;
  }
  return {...state, timer: event.data.data};
}

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
 * действует ли таймер. null — партия без таймера, таймер остановлен (STOPPED
 * приходит перед концом и отменой партии) или партия уже не идёт (на случай
 * снапшота без остановленного таймера).
 */
export function activeTimer(session: SessionData): ActiveTimer | null {
  if (session.status !== 'IN_PROGRESS') {
    return null;
  }
  const {state} = session;
  const timer = 'timer' in state ? state.timer : null;
  if (timer === undefined || timer === null || timer.status === 'STOPPED') {
    return null;
  }
  return {
    paused: timer.status === 'PAUSED',
    deadline: timer.deadline ?? null,
    pausedAt: timer.pausedAt ?? null,
  };
}
