import {
  SessionResultDto,
  type SessionResultDtoOutput,
} from '@qgames/api/gateway/zod';

import type {SessionState} from '../session';
import type {SessionModule} from './module';

/** Итог партии (модуль result): победа или ничья, победители, причина игры. */
export type SessionResult = SessionResultDtoOutput;

/** Блок модуля result в состоянии игры; null — итога нет (партия идёт или отменена). */
export interface ResultBlock {
  result?: SessionResult | null | undefined;
}

const ResultSchema = SessionResultDto.nullish();

/** Блок result по схеме контракта; нет блока или null — итога нет. */
export function isResultBlock(
  state: SessionState,
): state is SessionState & ResultBlock {
  return ResultSchema.safeParse(state['result']).success;
}

/**
 * Модуль result: итог партии. Ставится одним событием `result-set` вместе с
 * концом партии; у отменённой партии итога нет.
 */
export const resultModule: SessionModule = {
  name: 'result',
  isBlock: isResultBlock,
};

/** Итог партии; null — итога нет. */
export function sessionResult(state: ResultBlock): SessionResult | null {
  return state.result ?? null;
}
