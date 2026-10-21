import type {GameStateRules, SessionData} from '@qgames/game-core';
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
  moveError: string | null;
}

/**
 * Модуль игры: доска и то, что игра объявляет о своём состоянии (как
 * `GameRules` на бэкенде) — модули-механики (`modules`: core, turns, timer) и
 * guard своих игровых полей (`isGameState`). События журнала применяет общий
 * `applySessionEvent`, своего редьюсера у игры нет; по `modules` и
 * `isGameState` поток партии проверяет состояние после каждого события.
 */
export interface GameModule extends GameStateRules {
  Board: ComponentType<GameBoardProps>;
}
