import {
  CroissantAssetsDto,
  CroissantSessionStateDto,
  type CroissantSessionStateDtoOutput,
  type CroissantTileDtoOutput,
} from '@qgames/api/portal/zod';
import {
  checkSessionState,
  type GameStateRules,
  type SessionData,
  type SessionMeta,
  type SessionState,
} from '@qgames/game-core';

/** Код игры в контракте (`meta.game.code`). */
export const CROISSANT_CODE = 'croissant';

/** Выложить тайл: `data` — `{x, y, rotation}`. */
export const PLACE_TILE = 'PLACE_TILE';

/** Поставить кондитера на участок нового тайла: `data` — `{spotId}`. */
export const PLACE_CONFECTIONER = 'PLACE_CONFECTIONER';

/** Пропустить шаг кондитера (в том числе когда он не нужен). */
export const SKIP_CONFECTIONER = 'SKIP_CONFECTIONER';

/** Состояние партии «Круассана» для зрителя: блоки core и поля игры. */
export type CroissantState = CroissantSessionStateDtoOutput;

/** Тип тайла из каталога игры (`GameDetailsResponse.assets.tiles`). */
export type CroissantTile = CroissantTileDtoOutput;

/**
 * Каталог тайлов из статичных данных игры (`GameDetailsResponse.assets`): геометрия одна на все партии, поэтому в
 * состояние не входит — `board[].tile` и `currentTile` ссылаются на тип по `code`. null — данных нет или они
 * неразборчивы.
 */
export function parseCroissantTiles(
  assets: unknown,
): readonly CroissantTile[] | null {
  const parsed = CroissantAssetsDto.safeParse(assets);
  return parsed.success ? parsed.data.tiles : null;
}

export interface CroissantSession extends SessionData {
  meta: SessionMeta;
  state: CroissantState;
}

/**
 * Guard только игровых полей «Круассана»: поле сети, участки, ожидание кондитера и колода. Блоки core
 * проверяет общий guard.
 */
function isCroissantFields(state: SessionState): boolean {
  return CroissantSessionStateDto.safeParse(state).success;
}

export const croissantRules: GameStateRules = {isGameState: isCroissantFields};

/**
 * Партия «Круассана»: игра по `meta.game.code`, состояние — guard'ами core и игры. Правила игры на фронте не живут:
 * доска рисует только то, что пришло в состоянии, а действует по `players[].moveOptions`.
 */
export function isCroissantSession(
  session: SessionData,
): session is CroissantSession {
  if (session.meta.game.code !== CROISSANT_CODE) {
    return false;
  }
  return (
    CroissantSessionStateDto.safeParse(session.state).success &&
    checkSessionState(session.state, croissantRules)
  );
}
