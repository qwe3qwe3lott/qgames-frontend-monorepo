import type {GameStateRules, SessionData} from '@qgames/game-core';
import type {PlayerCardProps} from '@qgames/game-ui/components/PlayerCard';
import type {ComponentType} from 'react';

// Форма модуля игры, которую ожидает портал. Общий API игр ещё не выбран
// (CLAUDE.md §2, «решить при второй реализованной игре»): пакет игры описывает
// те же пропсы у себя, совместимость проверяет TypeScript в registry.ts.

export type GameAvatar = 'CAT' | 'DOG' | null;

export interface GameBoardPlayer {
  id: string;
  name: string;
  avatar: GameAvatar;
}

/** Партия из потока: снапшот с применёнными событиями и смещение часов. */
export type GameBoardSession = SessionData;

/** Ход — общий конверт бэкенда: вид действия и его параметры в формате игры. */
export interface GameMove {
  type: string;
  data?: Readonly<Record<string, unknown>>;
}

export interface GameBoardProps {
  session: GameBoardSession;
  players: readonly GameBoardPlayer[];
  viewerId: string;
  onMove: (move: GameMove) => void;
  movePending: boolean;
}

export interface GamePlayerCardProps {
  session: GameBoardSession;
  viewerId: string;
  /** Базовая карточка участника комнаты: имя, аватар, пометки и действия комнаты. */
  card: PlayerCardProps;
}

/**
 * Модуль игры: доска, карточка игрока в списке игроков комнаты (часы, цвет и
 * прочее игры поверх базовой `PlayerCard`) и guard своих игровых полей
 * (`isGameState`, как `GameRules` на бэкенде). Блоки core (игроки,
 * очерёдность, часы, итог) есть у каждой игры и проверяются общим guard'ом.
 * События журнала применяет общий `applySessionEvent`, своего редьюсера у игры
 * нет; guard'ом core и `isGameState` поток партии проверяет состояние после
 * каждого события.
 */
export interface GameModule extends GameStateRules {
  Board: ComponentType<GameBoardProps>;
  /** Нет — в списке игроков базовая карточка. */
  PlayerCard?: ComponentType<GamePlayerCardProps>;
}
