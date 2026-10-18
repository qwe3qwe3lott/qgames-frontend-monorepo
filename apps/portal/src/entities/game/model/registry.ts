import type {RoomResponseGameType} from '@qgames/api/gateway/model';

import type {GameModule} from './types';

/** Человекочитаемые коды игр в URL (`/games/<код>/…`). */
export const GAME_CODES = ['nothing-game', 'carcassonne'] as const;

export type GameCode = (typeof GAME_CODES)[number];

export interface GameInfo {
  code: GameCode;
  title: string;
  description: string;
  /** Тип игры в контракте бэкенда; null — игры там ещё нет. */
  gameType: RoomResponseGameType | null;
  playersLabel: string;
  /**
   * Загрузка модуля игры. Только динамический import(): каждая игра — отдельный чанк
   * (CLAUDE.md §2, статический импорт пакетов игр запрещён ESLint).
   */
  load: (() => Promise<GameModule>) | null;
}

export const GAMES: Readonly<Record<GameCode, GameInfo>> = {
  'nothing-game': {
    code: 'nothing-game',
    title: 'Игра в ничто',
    description:
      'Тестовая игра: игроки по очереди завершают ход, через три круга партия заканчивается.',
    gameType: 'NOTHING',
    playersLabel: '1–4 игрока',
    load: () =>
      import('@qgames/game-nothing-game').then(module => module.nothingGame),
  },
  carcassonne: {
    code: 'carcassonne',
    title: 'Каркассон',
    description: 'Строим города, дороги и монастыри. Игра в разработке.',
    gameType: null,
    playersLabel: '2–5 игроков',
    load: null,
  },
};

export function isGameCode(value: string): value is GameCode {
  return (GAME_CODES as readonly string[]).includes(value);
}

export function gameByCode(code: GameCode): GameInfo {
  return GAMES[code];
}

export function gameByType(
  gameType: RoomResponseGameType | undefined,
): GameInfo | undefined {
  return Object.values(GAMES).find(game => game.gameType === gameType);
}
