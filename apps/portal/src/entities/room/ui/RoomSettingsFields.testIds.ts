import {generateTestIds} from '@qgames/ui/lib/testIds';

// Поля различаются `data-field` — путём поля в форме (`room.maxSpectators`,
// `simple.variant`, `advanced.captureRequired`), сегменты выбора ещё и
// `data-value`. Сегменты режима правил — `data-value` (`simple`/`advanced`).
// Кнопки пресетов: правил — `data-value` (вариант), времени — `data-variant` и
// `data-value` (пресет).
export const testIds = generateTestIds('RoomSettingsFields', [
  'field',
  'option',
  'rulesMode',
  'baseMinutes',
  'baseSeconds',
  'rulePreset',
  'timePreset',
]);
