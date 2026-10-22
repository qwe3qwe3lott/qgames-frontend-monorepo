import type {CheckersColor} from '../state';

export const COLOR_LABELS: Readonly<Record<CheckersColor, string>> = {
  WHITE: 'Белые',
  BLACK: 'Чёрные',
};

/**
 * Причины окончания партии (`result.reason`) — русские тексты. Неизвестная
 * причина не показывается: итог (победа или ничья) виден и без неё.
 */
const REASON_LABELS: Readonly<Record<string, string>> = {
  NO_PIECES: 'Все шашки проигравшего сбиты.',
  NO_MOVES: 'Проигравшему некуда ходить.',
  RESIGN: 'Проигравший сдался.',
  TIMEOUT: 'У проигравшего вышло время на ход.',
  DRAW_RULE: 'Много ходов подряд только дамками и без взятий.',
};

export function reasonLabel(reason: string): string | undefined {
  return Object.hasOwn(REASON_LABELS, reason)
    ? REASON_LABELS[reason]
    : undefined;
}

/** Буква столбца для подписи клетки: 1 → «a». */
export function squareName(x: number, y: number): string {
  return `${String.fromCharCode(96 + x)}${String(y)}`;
}
