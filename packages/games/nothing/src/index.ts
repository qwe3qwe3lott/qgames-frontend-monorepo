import {reduceNothing} from './reducer';
import {Board} from './ui/board';

export type {BoardMove, BoardPlayer, BoardProps} from './types';

/** Модуль игры; портал загружает его отдельным чанком через import(). */
export const nothingGame = {Board, reduce: reduceNothing};
