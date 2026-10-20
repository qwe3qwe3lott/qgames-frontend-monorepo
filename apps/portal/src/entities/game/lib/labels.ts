/** Причина, почему для игры нельзя создать комнату (статус DISABLED). */
export const GAME_UNAVAILABLE_HINT = 'Игра временно недоступна';

/** Подсказка, когда пакета игры на фронте ещё нет. */
export const GAME_IN_DEVELOPMENT_HINT = 'Игра ещё в разработке';

const PLAYER_FORMS: Readonly<Record<Intl.LDMLPluralRule, string>> = {
  zero: 'игроков',
  one: 'игрок',
  two: 'игрока',
  few: 'игрока',
  many: 'игроков',
  other: 'игрока',
};

const pluralRules = new Intl.PluralRules('ru-RU');

/** Число игроков из правил игры: «2 игрока», «1–4 игрока», «2–5 игроков». */
export function playersLabel(minPlayers: number, maxPlayers: number): string {
  const range =
    minPlayers === maxPlayers
      ? String(maxPlayers)
      : `${String(minPlayers)}–${String(maxPlayers)}`;
  return `${range} ${PLAYER_FORMS[pluralRules.select(maxPlayers)]}`;
}
