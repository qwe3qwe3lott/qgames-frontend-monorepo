// Пропсы доски, которые передаёт портал. Общий API игр ещё не выбран (CLAUDE.md §2), поэтому форма
// дублирует ожидание портала и сверяется с ним структурной типизацией в registry.ts.

import type {SessionData} from '@qgames/game-core';
import type {PlayerCardProps} from '@qgames/game-ui/components/PlayerCard';

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
  /** Статичные данные игры из её карточки (`GameDetailsResponse.assets`): каталог тайлов, проверяется схемой. */
  assets: unknown;
}

/** Пропсы карточки игрока, которую портал подставляет в список игроков комнаты. */
export interface GamePlayerCardProps {
  session: SessionData;
  viewerId: string;
  /** Базовая карточка участника комнаты: имя, аватар, пометки и действия комнаты. */
  card: PlayerCardProps;
  /** Статичные данные игры из её карточки: каталог тайлов для превью, проверяется схемой. */
  assets: unknown;
}
