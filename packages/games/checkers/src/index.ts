import {checkersRules, COLOR_ALREADY_PICKED} from './state';
import {Board} from './ui/Board';
import {PlayerCard} from './ui/PlayerCard';

export type {
  BoardMove,
  BoardPlayer,
  BoardProps,
  GamePlayerCardProps,
} from './types';

/**
 * Модуль игры; портал загружает его отдельным чанком через import(). Своего
 * редьюсера нет: события журнала применяет общий `applySessionEvent`, а
 * состояние после каждого события портал проверяет guard'ом core и
 * `isGameState`. Опоздавший выбор цвета (`COLOR_ALREADY_PICKED`) портал не
 * показывает: стадия уже сменилась потоком.
 */
export const checkersGame = {
  Board,
  PlayerCard,
  ...checkersRules,
  staleMoveReasons: [COLOR_ALREADY_PICKED],
};
