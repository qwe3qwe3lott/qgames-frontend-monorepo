import {generateTestIds} from '@qgames/ui/lib/test-ids';

// Поля различаются `data-field` — путём поля в форме (`room.maxSpectators`,
// `simple.variant`, `advanced.captureRequired`), варианты радиокнопок ещё и
// `data-value`.
export const testIds = generateTestIds('RoomSettingsFields', [
  'field',
  'option',
  'advancedCheckbox',
  'baseMinutes',
  'baseSeconds',
]);
