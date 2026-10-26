import {
  SessionTurnsDto,
  type SessionTurnsDtoOutput,
} from '@qgames/api/portal/zod';

import type {SessionState} from '../session';
import type {SessionModule} from './module';

/** Очерёдность (модуль turns): чей ход, раунд, число раундов. */
export type SessionTurns = SessionTurnsDtoOutput;

/** Блок модуля turns в состоянии игры. */
export interface TurnsBlock {
  turns: SessionTurns;
}

/** Блок turns по схеме контракта. */
export function isTurnsBlock(
  state: SessionState,
): state is SessionState & TurnsBlock {
  return SessionTurnsDto.safeParse(state['turns']).success;
}

/** Модуль turns: очерёдность ходов и раунды. */
export const turnsModule: SessionModule = {
  name: 'turns',
  isBlock: isTurnsBlock,
};

/** Чей сейчас ход; null — ход ничей или партия закончилась. */
export function currentPlayerId(turns: SessionTurns): string | null {
  return turns.currentPlayerId ?? null;
}
