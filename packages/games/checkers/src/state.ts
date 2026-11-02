import {
  CheckersAdvancedRulesDto,
  CheckersColorPickStateDto,
  CheckersPlayerDto,
  CheckersSessionStateDto,
  type CheckersAdvancedRulesDtoOutput,
  type CheckersColorPickStateDtoOutput,
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

/**
 * Выбор своего цвета в стадии выбора цвета: `data` — `{color}`. Кто выбрал
 * первым, получает цвет, соперник — противоположный.
 */
export const PICK_COLOR = 'PICK_COLOR';

/**
 * Опоздавший выбор цвета: стадия уже сменилась, новое состояние придёт
 * потоком, ошибку показывать не нужно.
 */
export const COLOR_ALREADY_PICKED = 'COLOR_ALREADY_PICKED';

/** Стадия выбора цвета (`state.stage`). */
export const COLOR_PICK_STAGE = 'color-pick';

/** Состояние стадии игры шашек для зрителя: блоки core и поля игры. */
export type CheckersState = CheckersSessionStateDtoOutput;

/** Состояние стадии выбора цвета: только блоки core, цвета у игроков ещё нет. */
export type CheckersColorPickState = CheckersColorPickStateDtoOutput;

/** Итоговые правила партии (`meta.advancedRules`): флаги для подсказок ввода пути. */
export type CheckersAdvancedRules = CheckersAdvancedRulesDtoOutput;

export type CheckersColor = CheckersAdvancedRules['firstColor'];

export interface CheckersSession extends SessionData {
  meta: SessionMeta & {advancedRules: CheckersAdvancedRules};
  state: CheckersState;
}

export interface CheckersColorPickSession extends SessionData {
  meta: SessionMeta & {advancedRules: CheckersAdvancedRules};
  state: CheckersColorPickState;
}

/** Игровые поля стадии игры шашек (без блоков core, кроме стадии) по схеме контракта. */
const CheckersFieldsSchema = CheckersSessionStateDto.pick({
  stage: true,
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
 * Guard только игровых полей шашек по стадии: в выборе цвета своих полей нет
 * (состояние — схема стадии целиком); в игре — `pieces`, `lastMove`,
 * счётчики, `positionHistory`, `drawOfferedBy` и цвет в объектах игроков
 * `players[].color`.
 */
function isCheckersFields(state: SessionState): boolean {
  if (state['stage'] === COLOR_PICK_STAGE) {
    return CheckersColorPickStateDto.safeParse(state).success;
  }
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

/** Партия шашек с правилами хода и состоянием по guard'ам core и игры. */
function isCheckersGame(session: SessionData): boolean {
  return (
    session.meta.game.code === CHECKERS_CODE &&
    CheckersAdvancedRulesDto.safeParse(session.meta.advancedRules).success &&
    checkSessionState(session.state, checkersRules)
  );
}

/**
 * Партия шашек в стадии игры: игра определяется по `meta.game.code`,
 * состояние сверяется теми же guard'ами core и игры, что поток партии в
 * портале, правила хода `meta.advancedRules` — схемой
 * `CheckersAdvancedRulesDto`.
 */
export function isCheckersSession(
  session: SessionData,
): session is CheckersSession {
  return session.state['stage'] !== COLOR_PICK_STAGE && isCheckersGame(session);
}

/** Партия шашек в стадии выбора цвета. */
export function isCheckersColorPickSession(
  session: SessionData,
): session is CheckersColorPickSession {
  return session.state['stage'] === COLOR_PICK_STAGE && isCheckersGame(session);
}
