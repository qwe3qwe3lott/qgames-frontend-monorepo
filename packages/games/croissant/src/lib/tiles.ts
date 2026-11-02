// Модель тайла для рисования: только данные сервера (каталог тайлов приходит с карточкой игры), правил игры здесь нет.
// Форма частей тайла — в `tileGeometry.ts`.

/** Сторона тайла в контракте: N, E, S, W. */
export type Side = 'N' | 'E' | 'S' | 'W';

/** Чем занята сторона тайла. */
export type EdgeKind = 'BAKERY' | 'TRAIL' | 'PASTURE';

/** Тип участка сети. */
export type SpotKind = 'BAKERY' | 'TRAIL' | 'DAIRY' | 'PASTURE';

/** Стороны в порядке обхода по часовой стрелке. */
export const SIDES: readonly Side[] = ['N', 'E', 'S', 'W'];

/** Тип тайла в том виде, в каком он приходит в каталоге игры. */
export interface TileShape {
  readonly code: string;
  readonly title: string;
  readonly edges: readonly EdgeKind[];
  readonly bakeries: readonly {
    readonly sides: readonly Side[];
    readonly sign: boolean;
  }[];
  /**
   * Тропы: стороны выхода и цель. Тропа на одну сторону входит в пекарню `bakery` (индекс в `bakeries`), сыроварню
   * или сад; тропа на две стороны и больше соединяет их.
   */
  readonly trails: readonly {
    readonly sides: readonly Side[];
    readonly bakery?: number | null | undefined;
    readonly dairy: boolean;
    readonly garden: boolean;
  }[];
  readonly dairy: boolean;
  /** Сад в центре: тропы заканчиваются у него, кондитера на сад не ставят. */
  readonly garden: boolean;
  /** Луга: полуребра, которыми луг выходит к соседним клеткам. */
  readonly pastures: readonly {readonly halves: readonly HalfEdge[]}[];
}

/**
 * Полуребро — половина стороны тайла, как в контракте: у N и S `half` 0 — западная половина, 1 — восточная; у E и W
 * 0 — северная, 1 — южная.
 */
export interface HalfEdge {
  readonly dir: Side;
  readonly half: number;
}

/** Точка на плитке в px: начало — левый верхний угол, ось Y вниз (как в SVG). */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Часть тайла, которую можно отдать участку: тип участка и его индекс в каталоге тайла. */
export interface TilePart {
  readonly kind: SpotKind;
  readonly index: number;
}

/** Ключ части тайла: `<тип>:<индекс>` — так части сопоставляются участкам партии. */
export function partKey(part: TilePart): string {
  return `${part.kind}:${String(part.index)}`;
}

/** Ключ клетки: `x:y` — так же, как id тайла в состоянии. */
export function cellKey(x: number, y: number): string {
  return `${String(x)}:${String(y)}`;
}
