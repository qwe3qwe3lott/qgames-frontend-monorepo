import {Board} from './ui/board';

export type {BoardMove, BoardPlayer, BoardProps, BoardSession} from './types';

/** Модуль игры; портал загружает его отдельным чанком через import(). */
export const nothingGame = {Board};
