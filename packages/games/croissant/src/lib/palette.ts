/**
 * Палитра «Круассана»: тёплые тона пекарни, муки и лугов. Своя — арт игры живёт в её пакете, а не в общей теме портала.
 */
export const PALETTE = {
  bakery: '#d9a066',
  bakeryLine: '#b07a45',
  trailLine: '#c9a227',
  pasture: '#b9d3a7',
  dairy: '#fff6e0',
  dairyLine: '#a98b5d',
  garden: '#6fa35a',
  gardenLine: '#3f6b33',
  sign: '#8c2f39',
  grid: '#8a8a8a66',
  /** Выбор участка для кондитера: не совпадает ни с одним цветом игрока. */
  highlight: '#7c3aed',
  /** Цвета игроков (`players[].color`): фишки кондитеров, рамка последнего тайла. */
  confectioners: {
    RED: '#dc2626',
    YELLOW: '#facc15',
    GREEN: '#16a34a',
    BLUE: '#2563eb',
    BLACK: '#1f2937',
  },
  /** Игрока нет в состоянии: фишка или тайл неизвестного игрока. */
  unknownPlayer: '#6b7280',
} as const;
