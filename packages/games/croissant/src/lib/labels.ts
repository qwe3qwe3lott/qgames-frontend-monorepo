/** Подписи участков сети и итога: тексты игры живут в её пакете. */

import type {SpotKind} from './tiles';

export const SPOT_LABELS: Readonly<Record<SpotKind, string>> = {
  BAKERY: 'Пекарня',
  TRAIL: 'Мучная тропа',
  DAIRY: 'Сыроварня',
  PASTURE: 'Луг',
};

/** Текст причины окончания партии (`result.reason`) — свои слова, без терминов чужих правил. */
export function reasonLabel(reason: string): string {
  if (reason === 'SCORED') {
    return 'Колода кончилась — подведён итог по сети заведений';
  }
  if (reason === 'TIMEOUT') {
    return 'У остальных пекарей вышло время — подведён итог по сети заведений';
  }
  return reason;
}

/** Подпись стороны тайла для легенды. */
export const EDGE_LABELS = {
  BAKERY: 'Пекарня',
  TRAIL: 'Мучная тропа',
  PASTURE: 'Луг',
} as const;
