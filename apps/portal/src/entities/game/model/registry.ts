import type {makeMove} from '@qgames/api/gateway';
import type {RoomResponseGameType} from '@qgames/api/gateway/model';

import type {GameModule} from './types';

/**
 * Коды игр — те же, что в контракте бэкенда (`GameCodes`): они стоят и в URL портала
 * (`/games/<код>/…`), и в пути ручки хода. `carcassonne` пока есть только на фронте.
 */
export const GAME_CODES = ['nothing', 'carcassonne'] as const;

export type GameCode = (typeof GAME_CODES)[number];

/** Коды игр, которые знает бэкенд (из сгенерированной ручки хода). */
export type ApiGameCode = Parameters<typeof makeMove>[0];

/** Всё, что нужно для игры через API; нет — игры на бэкенде ещё нет. */
export interface GameApi {
  gameCode: ApiGameCode;
  gameType: RoomResponseGameType;
  /**
   * Загрузка модуля игры. Только динамический import(): каждая игра — отдельный чанк
   * (CLAUDE.md §2, статический импорт пакетов игр запрещён ESLint).
   */
  load: () => Promise<GameModule>;
}

export interface GameInfo {
  code: GameCode;
  title: string;
  description: string;
  playersLabel: string;
  api: GameApi | null;
}

export const GAMES: Readonly<Record<GameCode, GameInfo>> = {
  nothing: {
    code: 'nothing',
    title: 'Игра в ничто',
    description:
      'Тестовая игра: игроки по очереди завершают ход, через три круга партия заканчивается.',
    playersLabel: '1–4 игрока',
    api: {
      gameCode: 'nothing',
      gameType: 'NOTHING',
      load: () =>
        import('@qgames/game-nothing').then(module => module.nothingGame),
    },
  },
  carcassonne: {
    code: 'carcassonne',
    title: 'Каркассон',
    description: 'Строим города, дороги и монастыри. Игра в разработке.',
    playersLabel: '2–5 игроков',
    api: null,
  },
};

export function isGameCode(value: string): value is GameCode {
  return (GAME_CODES as readonly string[]).includes(value);
}

export function gameByCode(code: GameCode): GameInfo {
  return GAMES[code];
}

export function gameByType(
  gameType: RoomResponseGameType,
): GameInfo | undefined {
  return Object.values(GAMES).find(game => game.api?.gameType === gameType);
}
