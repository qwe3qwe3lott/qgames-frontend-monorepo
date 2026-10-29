import {generateTestIds} from '@qgames/ui/lib/test-ids';

/** Текущий администратор — с `data-login`. */
export const testIds = generateTestIds('Header', [
  'homeLink',
  'adminsLink',
  'currentAdmin',
]);
