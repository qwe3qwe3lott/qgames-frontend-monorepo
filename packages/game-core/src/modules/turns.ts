import type {SessionTurnsDtoOutput} from '@qgames/api/gateway/zod';

import type {SessionLogEvent} from '../session';

/** Очерёдность (модуль turns): чей ход, раунд, число раундов. */
export type SessionTurns = SessionTurnsDtoOutput;

/** Блок модуля turns в состоянии игры. */
export interface TurnsBlock {
  turns: SessionTurns;
}

/** Модуль turns: `turns-changed` заменяет блок целиком (PUT). */
export function reduceTurns<S extends TurnsBlock>(
  state: S,
  event: SessionLogEvent,
): S {
  if (event.type !== 'turns-changed') {
    return state;
  }
  return {...state, turns: event.data.data};
}

/** Чей сейчас ход; null — ход ничей или партия закончилась. */
export function currentPlayerId(turns: SessionTurns): string | null {
  return turns.currentPlayerId ?? null;
}
