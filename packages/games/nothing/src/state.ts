import {
  checkSessionState,
  type GameStateRules,
  type SessionData,
  type SessionState,
} from '@qgames/game-core';
import {
  NothingSessionStateDto,
  type NothingSessionStateDtoOutput,
} from '@qgames/api/portal/zod';

/** Код игры в контракте (`meta.game.code`). */
export const NOTHING_CODE = 'nothing';

/** Единственный вид хода: «Завершить ход». */
export const PASS = 'PASS';

/** Состояние партии «ничто» для зрителя: блоки core и число ходов. */
export type NothingState = NothingSessionStateDtoOutput;

export interface NothingSession extends SessionData {
  state: NothingState;
}

/** Игровые поля «ничто» (без блоков core) по схеме контракта. */
const NothingFieldsSchema = NothingSessionStateDto.pick({moves: true});

/** Guard только игровых полей «ничто»: `moves`. */
function isNothingFields(state: SessionState): boolean {
  return NothingFieldsSchema.safeParse(state).success;
}

/**
 * Состояние «ничто» (как `GameRules` на бэкенде): блоки core проверяются
 * общим guard'ом (таймер может быть null — партия без времени на ход, итог
 * у «ничто» всегда null), игра объявляет только guard своих полей.
 */
export const nothingRules: GameStateRules = {isGameState: isNothingFields};

/**
 * Партия «ничто»: игра определяется по `meta.game.code`, состояние сверяется
 * теми же guard'ами core и игры, что поток партии в портале.
 */
export function isNothingSession(
  session: SessionData,
): session is NothingSession {
  return (
    session.meta.game.code === NOTHING_CODE &&
    checkSessionState(session.state, nothingRules)
  );
}
