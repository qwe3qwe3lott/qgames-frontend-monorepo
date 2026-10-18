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

export interface GameBoardSession {
  status: 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
  players: readonly string[];
  version: number;
  state: unknown;
}

export interface GameBoardProps {
  session: GameBoardSession;
  players: readonly GameBoardPlayer[];
  viewerId: string;
  onMove: (move: Readonly<Record<string, unknown>>) => void;
  movePending: boolean;
  moveError: string | null;
}

export interface GameModule {
  Board: ComponentType<GameBoardProps>;
}
