/**
 * Тестовые игроки стенда (профиль local бэкенда, `qgames.auth.dev-users`):
 * логины `qwe3qwe1..qwe3qwe10`, общий пароль.
 */
const LOGIN_PREFIX = 'qwe3qwe';
const PLAYERS_COUNT = 10;
export const PLAYER_PASSWORD = 'qwe3qwe3';

/** Игроков на один воркер: основной и до двух акторов. */
export const PLAYERS_PER_WORKER = 3;

/**
 * Логин [index]-го игрока воркера [parallelIndex]. Воркеры получают
 * непересекающиеся наборы игроков, поэтому тесты не мешают друг другу.
 */
export function playerLogin(parallelIndex: number, index: number): string {
  if (index >= PLAYERS_PER_WORKER) {
    throw new Error(
      `В тесте не больше ${String(PLAYERS_PER_WORKER)} игроков (основной и акторы)`,
    );
  }
  const number = parallelIndex * PLAYERS_PER_WORKER + index + 1;
  if (number > PLAYERS_COUNT) {
    throw new Error(
      `Тестовых игроков ${String(PLAYERS_COUNT)}: воркеров не больше ${String(Math.floor(PLAYERS_COUNT / PLAYERS_PER_WORKER))}`,
    );
  }
  return `${LOGIN_PREFIX}${String(number)}`;
}
