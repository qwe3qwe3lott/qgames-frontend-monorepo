import {
  CheckersAdvancedRulesDto,
  CheckersPlayerDto,
  CheckersSessionStateDto,
  type CheckersAdvancedRulesDtoOutput,
  type CheckersSessionStateDtoOutput,
} from '@qgames/api/portal/zod';
import {
  checkSessionState,
  type GameStateRules,
  type SessionData,
  type SessionMeta,
  type SessionState,
} from '@qgames/game-core';

/** Код игры в контракте (`meta.game.code`). */
export const CHECKERS_CODE = 'checkers';

/**
 * Ход шашкой: `data` — полный путь `{path: [[x, y], …]}` с начальной клеткой;
 * `offerDraw: true` — предложить ничью вместе с ходом.
 */
export const MOVE = 'MOVE';

/** Принять ничью, предложенную соперником (в свой ход, без `data`). */
export const ACCEPT_DRAW = 'ACCEPT_DRAW';

/** Сдача: доступна обоим игрокам, вне очереди. */
export const RESIGN = 'RESIGN';

/** Состояние партии шашек для зрителя: блоки core и поля игры. */
export type CheckersState = CheckersSessionStateDtoOutput;

/** Итоговые правила партии (`meta.advancedRules`): флаги для подсказок ввода пути. */
export type CheckersAdvancedRules = CheckersAdvancedRulesDtoOutput;

export type CheckersColor = CheckersAdvancedRules['firstColor'];

export interface CheckersSession extends SessionData {
  meta: SessionMeta & {advancedRules: CheckersAdvancedRules};
  state: CheckersState;
}

/** Игровые поля шашек (без блоков core) по схеме контракта. */
const CheckersFieldsSchema = CheckersSessionStateDto.pick({
  pieces: true,
  lastMove: true,
  quietMoves: true,
  materialMoves: true,
  positionHistory: true,
  drawOfferedBy: true,
});

/** Игроки с полем игры `color` (поля core игрока проверяет guard core). */
const CheckersPlayersSchema = CheckersPlayerDto.array();

/**
 * Guard только игровых полей шашек: `pieces`, `lastMove`, счётчики,
 * `positionHistory`, `drawOfferedBy` и цвет в объектах игроков `players[].color`.
 */
function isCheckersFields(state: SessionState): boolean {
  return (
    CheckersFieldsSchema.safeParse(state).success &&
    CheckersPlayersSchema.safeParse(state['players']).success
  );
}

/**
 * Состояние шашек (как `GameRules` на бэкенде): блоки core проверяются общим
 * guard'ом (таймер может быть null — партия без часов), игра объявляет только
 * guard своих полей.
 */
export const checkersRules: GameStateRules = {isGameState: isCheckersFields};

/**
 * Партия шашек: игра определяется по `meta.game.code`, состояние сверяется
 * теми же guard'ами core и игры, что поток партии в портале, правила хода
 * `meta.advancedRules` — схемой `CheckersAdvancedRulesDto`.
 */
export function isCheckersSession(
  session: SessionData,
): session is CheckersSession {
  return (
    session.meta.game.code === CHECKERS_CODE &&
    CheckersAdvancedRulesDto.safeParse(session.meta.advancedRules).success &&
    checkSessionState(session.state, checkersRules)
  );
}
