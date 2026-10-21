import type {SessionData} from '@qgames/game-core';
import {
  NothingSessionStateDto,
  type NothingSessionStateDtoOutput,
} from '@qgames/api/gateway/zod';

/** Код игры в контракте (`meta.game.code`). */
export const NOTHING_CODE = 'nothing';

/** Единственный вид хода: «Завершить ход». */
export const PASS = 'PASS';

/** Состояние партии «ничто» для зрителя: модули core, turns, timer и число ходов. */
export type NothingState = NothingSessionStateDtoOutput;

export interface NothingSession extends SessionData {
  state: NothingState;
}

/**
 * Партия «ничто»: игра определяется по `meta.game.code`, состояние сверяется
 * сгенерированной схемой. Состояние другой формы — не наша партия.
 */
export function isNothingSession(
  session: SessionData,
): session is NothingSession {
  return (
    session.meta.game.code === NOTHING_CODE &&
    NothingSessionStateDto.safeParse(session.state).success
  );
}
