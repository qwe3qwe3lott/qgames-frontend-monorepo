import {Board} from './ui/Board';
import {PlayerCard} from './ui/PlayerCard';
import {croissantRules} from './state';

export type {
  BoardMove,
  BoardPlayer,
  BoardProps,
  GamePlayerCardProps,
} from './types';

/**
 * Модуль игры; портал загружает его отдельным чанком через import(). Своего редьюсера нет: события журнала применяет
 * общий `applySessionEvent`, а состояние после каждого события портал проверяет guard'ом core и `isGameState`.
 */
export const croissantGame = {
  Board,
  PlayerCard,
  ...croissantRules,
};
