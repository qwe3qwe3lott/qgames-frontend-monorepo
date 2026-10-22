import {
  checkSessionState,
  coreModule,
  resultModule,
  timerModule,
  turnsModule,
  type GameStateRules,
  type SessionData,
  type SessionState,
} from '@qgames/game-core';
import {
  NothingSessionStateDto,
  type NothingSessionStateDtoOutput,
} from '@qgames/api/gateway/zod';

/** Код игры в контракте (`meta.game.code`). */
export const NOTHING_CODE = 'nothing';

/** Единственный вид хода: «Завершить ход». */
export const PASS = 'PASS';

/** Состояние партии «ничто» для зрителя: модули core, turns, timer, result и число ходов. */
export type NothingState = NothingSessionStateDtoOutput;

export interface NothingSession extends SessionData {
  state: NothingState;
}

/** Игровые поля «ничто» (без блоков модулей) по схеме контракта. */
const NothingFieldsSchema = NothingSessionStateDto.pick({moves: true});

/** Guard только игровых полей «ничто»: `moves`. */
function isNothingFields(state: SessionState): boolean {
  return NothingFieldsSchema.safeParse(state).success;
}

/**
 * Состояние «ничто» (как `GameRules` на бэкенде): модули core, turns, timer,
 * result (таймер может быть null — партия без времени на ход, итог у «ничто»
 * всегда null) и игровые поля.
 */
export const nothingRules: GameStateRules = {
  modules: [coreModule, turnsModule, timerModule, resultModule],
  isGameState: isNothingFields,
};

/**
 * Партия «ничто»: игра определяется по `meta.game.code`, состояние сверяется
 * теми же guard'ами модулей и игры, что поток партии в портале.
 */
export function isNothingSession(
  session: SessionData,
): session is NothingSession {
  return (
    session.meta.game.code === NOTHING_CODE &&
    checkSessionState(session.state, nothingRules)
  );
}
