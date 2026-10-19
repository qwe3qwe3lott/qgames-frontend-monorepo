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

/** Ход — общий конверт бэкенда: вид действия и его параметры в формате игры. */
export interface BoardMove {
  type: string;
  data?: Readonly<Record<string, unknown>>;
}

export interface BoardProps {
  session: BoardSession;
  /** Участники комнаты (и бывшие игроки партии) для имён и аватаров. */
  players: readonly BoardPlayer[];
  viewerId: string;
  onMove: (move: BoardMove) => void;
  movePending: boolean;
  moveError: string | null;
}
