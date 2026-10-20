import type {GameModule} from './types';

/**
 * Коды игр — те же, что в контракте бэкенда (`GameCode`): они стоят и в URL портала
 * (`/games/<код>/…`), и в путях ручек `/api/games/{код}/…`. Список ведётся вручную,
 * а не выводится из сгенерированного типа: к каждому коду привязан динамический
 * `import()` пакета игры. Название, описание и правила приходят с бэкенда
 * (`GET /api/games`, `GET /api/games/{код}`).
 */
export const GAME_CODES = ['nothing', 'carcassonne'] as const;

export type GameCode = (typeof GAME_CODES)[number];

/**
 * Загрузка модуля игры. Только динамический import(): каждая игра — отдельный чанк
 * (CLAUDE.md §2, статический импорт пакетов игр запрещён ESLint).
 */
export type GameLoader = () => Promise<GameModule>;

export interface GameEntry {
  code: GameCode;
  /** Нет — пакета игры ещё нет: доска не рисуется, комнату создать нельзя. */
  load?: GameLoader;
}

export const GAMES: Readonly<Record<GameCode, GameEntry>> = {
  nothing: {
    code: 'nothing',
    load: () =>
      import('@qgames/game-nothing').then(module => module.nothingGame),
  },
  carcassonne: {code: 'carcassonne'},
};

export function isGameCode(value: string): value is GameCode {
  return (GAME_CODES as readonly string[]).includes(value);
}

export function gameByCode(code: GameCode): GameEntry {
  return GAMES[code];
}
