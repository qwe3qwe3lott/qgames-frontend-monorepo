import {generateTestIds} from '@qgames/ui/lib/testIds';

/** Карточка игрока — `root` с `data-user-id`, `data-owner` и `data-self`; `activity` — шаг ходящего. */
export const testIds = generateTestIds('PlayerCard', ['activity']);
