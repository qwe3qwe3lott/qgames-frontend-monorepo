import {
  CheckersMoveRulesDto,
  CheckersPlayerDto,
  CheckersSessionStateDto,
  type CheckersMoveRulesDtoOutput,
  type CheckersSessionStateDtoOutput,
} from '@qgames/api/gateway/zod';
import {
  checkSessionState,
  coreModule,
  resultModule,
  timerModule,
  turnsModule,
  type GameStateRules,
  type SessionData,
  type SessionMeta,
  type SessionState,
} from '@qgames/game-core';

/** Код игры в контракте (`meta.game.code`). */
export const CHECKERS_CODE = 'checkers';

/** Ход шашкой: `data` — полный путь `{path: [[x, y], …]}` с начальной клеткой. */
export const MOVE = 'MOVE';

/** Сдача: доступна обоим игрокам, вне очереди. */
export const RESIGN = 'RESIGN';

/** Состояние партии шашек для зрителя: модули core, turns, timer, result и поля игры. */
export type CheckersState = CheckersSessionStateDtoOutput;

/** Правила хода партии (`meta.moveRules`): флаги для подсказок ввода пути. */
export type CheckersMoveRules = CheckersMoveRulesDtoOutput;

export type CheckersColor = CheckersMoveRules['firstColor'];

export interface CheckersSession extends SessionData {
  meta: SessionMeta & {moveRules: CheckersMoveRules};
  state: CheckersState;
}

/** Игровые поля шашек (без блоков модулей) по схеме контракта. */
const CheckersFieldsSchema = CheckersSessionStateDto.pick({
  pieces: true,
  lastMove: true,
  quietMoves: true,
});

/** Игроки с полем игры `color` (блок core проверяет модуль core). */
const CheckersPlayersSchema = CheckersPlayerDto.array();

/**
 * Guard только игровых полей шашек: `pieces`, `lastMove`, `quietMoves` и цвет
 * в объектах игроков `players[].color`.
 */
function isCheckersFields(state: SessionState): boolean {
  return (
    CheckersFieldsSchema.safeParse(state).success &&
    CheckersPlayersSchema.safeParse(state['players']).success
  );
}

/**
 * Состояние шашек (как `GameRules` на бэкенде): модули core, turns, timer
 * (null — партия без времени на ход), result и игровые поля.
 */
export const checkersRules: GameStateRules = {
  modules: [coreModule, turnsModule, timerModule, resultModule],
  isGameState: isCheckersFields,
};

/**
 * Партия шашек: игра определяется по `meta.game.code`, состояние сверяется
 * теми же guard'ами модулей и игры, что поток партии в портале, правила хода
 * `meta.moveRules` — схемой `CheckersMoveRulesDto`.
 */
export function isCheckersSession(
  session: SessionData,
): session is CheckersSession {
  return (
    session.meta.game.code === CHECKERS_CODE &&
    CheckersMoveRulesDto.safeParse(session.meta.moveRules).success &&
    checkSessionState(session.state, checkersRules)
  );
}
