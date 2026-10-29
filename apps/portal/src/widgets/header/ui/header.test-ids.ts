import {generateTestIds} from '@qgames/ui/lib/test-ids';

/** Ссылка профиля — с `data-login` текущего пользователя. */
export const testIds = generateTestIds('Header', [
  'homeLink',
  'gamesLink',
  'roomsLink',
  'profileLink',
  'loginButton',
]);
