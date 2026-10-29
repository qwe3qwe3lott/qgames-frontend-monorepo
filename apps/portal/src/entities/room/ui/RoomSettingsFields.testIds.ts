import {generateTestIds} from '@qgames/ui/lib/testIds';

// Поля различаются `data-field` — путём поля в форме (`room.maxSpectators`,
// `simple.variant`, `advanced.captureRequired`), варианты радиокнопок ещё и
// `data-value`. Кнопки пресетов: правил — `data-value` (вариант), времени —
// `data-variant` и `data-value` (пресет).
export const testIds = generateTestIds('RoomSettingsFields', [
  'field',
  'option',
  'advancedCheckbox',
  'baseMinutes',
  'baseSeconds',
  'rulePreset',
  'timePreset',
]);
