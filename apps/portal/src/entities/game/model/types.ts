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
  /** Дедлайн текущего хода по часам сервера (ISO 8601); null — без таймера или партия не идёт. */
  moveDeadline: string | null;
  /**
   * Момент постановки на паузу по часам сервера (ISO 8601); null — не на паузе.
   * На паузе ходить нельзя, остаток времени хода = moveDeadline − pausedAt.
   */
  pausedAt: string | null;
  /** Смещение часов: время сервера минус `Date.now()` клиента, мс. */
  clockOffsetMs: number;
}

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

export interface GameModule {
  Board: ComponentType<GameBoardProps>;
}
