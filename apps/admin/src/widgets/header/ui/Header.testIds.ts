import {generateTestIds} from '@qgames/ui/lib/testIds';

/** Текущий администратор — с `data-login`. */
export const testIds = generateTestIds('Header', [
  'homeLink',
  'adminsLink',
  'currentAdmin',
]);
