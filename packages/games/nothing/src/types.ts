// Пропсы доски, которые передаёт портал. Общий API игр ещё не выбран (CLAUDE.md §2),
// поэтому форма дублирует ожидание портала и сверяется с ним структурной типизацией.

import type {SessionData} from '@qgames/game-core';

export interface BoardPlayer {
  id: string;
  name: string;
  avatar: 'CAT' | 'DOG' | null;
}

/** Ход — общий конверт бэкенда: вид действия и его параметры в формате игры. */
export interface BoardMove {
  type: string;
  data?: Readonly<Record<string, unknown>>;
}

export interface BoardProps {
  /** Партия из потока: снапшот и применённые события, смещение часов. */
  session: SessionData;
  /** Участники комнаты (и бывшие игроки партии) для имён и аватаров. */
  players: readonly BoardPlayer[];
  viewerId: string;
  onMove: (move: BoardMove) => void;
  movePending: boolean;
  moveError: string | null;
}
