import {checkersRules} from './state';
import {Board} from './ui/Board';

export type {BoardMove, BoardPlayer, BoardProps} from './types';

/**
 * Модуль игры; портал загружает его отдельным чанком через import(). Своего
 * редьюсера нет: события журнала применяет общий `applySessionEvent`, а
 * состояние после каждого события портал проверяет guard'ом core и
 * `isGameState`.
 */
export const checkersGame = {Board, ...checkersRules};
