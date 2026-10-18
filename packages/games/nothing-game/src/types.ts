// Пропсы доски, которые передаёт портал. Общий API игр ещё не выбран (CLAUDE.md §2),
// поэтому форма дублирует ожидание портала и сверяется с ним структурной типизацией.

export interface BoardPlayer {
  id: string;
  name: string;
  avatar: 'CAT' | 'DOG' | null;
}

export interface BoardSession {
  status: 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
  /** Игроки партии в порядке мест. */
  players: readonly string[];
  version: number;
  /** Состояние партии с точки зрения зрителя; формат задаёт игра. */
  state: unknown;
}

export interface BoardProps {
  session: BoardSession;
  /** Участники комнаты (и бывшие игроки партии) для имён и аватаров. */
  players: readonly BoardPlayer[];
  viewerId: string;
  onMove: (move: Readonly<Record<string, unknown>>) => void;
  movePending: boolean;
  moveError: string | null;
}
