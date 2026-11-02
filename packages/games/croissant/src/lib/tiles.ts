// Геометрия тайла для рисования: только данные сервера (каталог тайлов приходит с карточкой игры),
// правил игры здесь нет.

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
  readonly trails: readonly {readonly sides: readonly Side[]}[];
  readonly dairy: boolean;
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

/** Повёрнутая плитка: чем занята каждая абсолютная сторона и где проходят тропы. */
export interface RenderTile {
  readonly edges: Readonly<Record<Side, EdgeKind>>;
  readonly trails: readonly Side[];
  readonly dairy: boolean;
}

/** Сторона в каталоге (базовая ориентация) по абсолютной стороне при повороте `rotation` градусов. */
function localSide(side: Side, rotation: number): Side {
  const turn = Math.round(rotation / 90);
  const index = (SIDES.indexOf(side) - turn + 4) % 4;
  return SIDES[index] ?? 'N';
}

/** Абсолютная сторона по стороне каталога. */
export function sideOf(local: Side, rotation: number): Side {
  const turn = Math.round(rotation / 90);
  return SIDES[(SIDES.indexOf(local) + turn) % 4] ?? 'N';
}

/** Повёрнутая геометрия тайла: по ней считается рисование. */
export function renderTile(tile: TileShape, rotation: number): RenderTile {
  const edges: Record<Side, EdgeKind> = {
    N: 'PASTURE',
    E: 'PASTURE',
    S: 'PASTURE',
    W: 'PASTURE',
  };
  SIDES.forEach(side => {
    const kind = tile.edges[SIDES.indexOf(localSide(side, rotation))];
    edges[side] = kind ?? 'PASTURE';
  });
  const trails = tile.trails.flatMap(trail =>
    trail.sides.map(side => sideOf(side, rotation)),
  );
  return {
    edges,
    trails,
    dairy: tile.dairy,
  };
}

/** Точка на плитке в px: начало — левый верхний угол, ось Y вниз (как в SVG). */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Полуребра в порядке обхода: по ним плитка делится на восемь треугольников. */
const HALF_EDGES: readonly HalfEdge[] = SIDES.flatMap(dir => [
  {dir, half: 0},
  {dir, half: 1},
]);

function turnsOf(rotation: number): number {
  return Math.round(rotation / 90);
}

/** Угол клетки, к которому прилегает полуребро: (±1, ±1), ось Y вверх — как в геометрии сервера. */
function cornerOf(edge: HalfEdge): readonly [number, number] {
  const first = edge.half === 0;
  switch (edge.dir) {
    case 'N':
      return [first ? -1 : 1, 1];
    case 'S':
      return [first ? -1 : 1, -1];
    case 'E':
      return [1, first ? 1 : -1];
    case 'W':
      return [-1, first ? 1 : -1];
  }
}

/** Половина стороны `dir`, которой принадлежит угол `corner`. */
function halfOf(dir: Side, corner: readonly [number, number]): number {
  const [x, y] = cornerOf({dir, half: 0});
  return x === corner[0] && y === corner[1] ? 0 : 1;
}

/** Поворот угла по часовой стрелке `turns` раз. */
function rotateCorner(
  corner: readonly [number, number],
  turns: number,
): readonly [number, number] {
  let [x, y] = corner;
  for (let step = 0; step < ((turns % 4) + 4) % 4; step++) {
    [x, y] = [y, -x];
  }
  return [x, y];
}

/** Абсолютное полуребро по полуребру каталога при повороте `rotation`. */
export function halfEdgeOf(local: HalfEdge, rotation: number): HalfEdge {
  const dir = sideOf(local.dir, rotation);
  return {
    dir,
    half: halfOf(dir, rotateCorner(cornerOf(local), turnsOf(rotation))),
  };
}

/** Полуребро каталога по абсолютному полуребру. */
function localHalfEdge(absolute: HalfEdge, rotation: number): HalfEdge {
  const dir = localSide(absolute.dir, rotation);
  return {
    dir,
    half: halfOf(dir, rotateCorner(cornerOf(absolute), -turnsOf(rotation))),
  };
}

function sameHalfEdge(a: HalfEdge, b: HalfEdge): boolean {
  return a.dir === b.dir && a.half === b.half;
}

/** Угол плитки в px. */
function cornerPoint(edge: HalfEdge, size: number): Point {
  const [x, y] = cornerOf(edge);
  return {x: ((x + 1) / 2) * size, y: ((1 - y) / 2) * size};
}

/** Середина стороны плитки в px. */
export function sideMidpoint(side: Side, size: number): Point {
  const half = size / 2;
  switch (side) {
    case 'N':
      return {x: half, y: 0};
    case 'E':
      return {x: size, y: half};
    case 'S':
      return {x: half, y: size};
    case 'W':
      return {x: 0, y: half};
  }
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

/** Треугольник «центр, угол, середина стороны» у полуребра `edge`; `owner` — пекарня или луг, null — ничей. */
export interface TileArea {
  readonly edge: HalfEdge;
  readonly owner: TilePart | null;
  readonly points: readonly [Point, Point, Point];
}

/** Части плитки: восемь треугольников, линии троп от центра к сторонам и круг сыроварни в центре. */
export interface TileRegions {
  readonly areas: readonly TileArea[];
  readonly trails: readonly (TilePart & {
    readonly from: Point;
    readonly to: Point;
  })[];
  readonly dairy: Point | null;
}

/** Владелец абсолютного полуребра: пекарня его стороны или луг по каталогу. */
function ownerOf(
  tile: TileShape,
  rotation: number,
  edge: HalfEdge,
): TilePart | null {
  const bakery = tile.bakeries.findIndex(item =>
    item.sides.some(side => sideOf(side, rotation) === edge.dir),
  );
  if (bakery >= 0) {
    return {kind: 'BAKERY', index: bakery};
  }
  const local = localHalfEdge(edge, rotation);
  const pasture = tile.pastures.findIndex(item =>
    item.halves.some(half => sameHalfEdge(half, local)),
  );
  return pasture >= 0 ? {kind: 'PASTURE', index: pasture} : null;
}

/** Части повёрнутой плитки размера `size`: по ним рисуется выбор участка для кондитера. */
export function tileRegions(
  tile: TileShape,
  rotation: number,
  size: number,
): TileRegions {
  const center: Point = {x: size / 2, y: size / 2};
  const areas = HALF_EDGES.map(edge => ({
    edge,
    owner: ownerOf(tile, rotation, edge),
    points: [
      center,
      cornerPoint(edge, size),
      sideMidpoint(edge.dir, size),
    ] as const,
  }));
  const trails = tile.trails.flatMap((trail, index) =>
    trail.sides.map(side => ({
      kind: 'TRAIL' as const,
      index,
      from: center,
      to: sideMidpoint(sideOf(side, rotation), size),
    })),
  );
  return {areas, trails, dairy: tile.dairy ? center : null};
}

function samePart(a: TilePart | null, b: TilePart): boolean {
  return a !== null && a.kind === b.kind && a.index === b.index;
}

/**
 * Контур части `part` из треугольников `areas`: стороны треугольников, за которыми лежит другая часть (или край
 * плитки). Внутренние стыки треугольников одной части не рисуются.
 */
export function partOutline(
  areas: readonly TileArea[],
  part: TilePart,
): readonly (readonly [Point, Point])[] {
  const ownerAt = (edge: HalfEdge): TilePart | null =>
    areas.find(area => sameHalfEdge(area.edge, edge))?.owner ?? null;
  return areas
    .filter(area => samePart(area.owner, part))
    .flatMap(area => {
      const [center, corner, middle] = area.points;
      const [cx, cy] = cornerOf(area.edge);
      // Соседи треугольника: через «центр — середину» — вторая половина той же стороны, через «центр — угол» —
      // половина соседней стороны у того же угла.
      const sameSide: HalfEdge = {dir: area.edge.dir, half: 1 - area.edge.half};
      const sameCorner = HALF_EDGES.find(edge => {
        const [x, y] = cornerOf(edge);
        return edge.dir !== area.edge.dir && x === cx && y === cy;
      });
      const segments: (readonly [Point, Point])[] = [[corner, middle]];
      if (!samePart(ownerAt(sameSide), part)) {
        segments.push([middle, center]);
      }
      if (sameCorner === undefined || !samePart(ownerAt(sameCorner), part)) {
        segments.push([center, corner]);
      }
      return segments;
    });
}

/** Центр треугольника. */
function centroid(points: readonly [Point, Point, Point]): Point {
  return {
    x: (points[0].x + points[1].x + points[2].x) / 3,
    y: (points[0].y + points[1].y + points[2].y) / 3,
  };
}

/**
 * Точка кондитера на плитке: у пекарни и тропы — у первой их стороны этого тайла, у сыроварни — в центре, у луга —
 * в треугольнике его первого полуребра (лучше — на стороне-луге, подальше от тропы). По ней ставится фишка: она видна
 * даже при мелком масштабе и попадает в свой квартал.
 */
export function spotAnchor(
  tile: TileShape,
  rotation: number,
  kind: SpotKind,
  index: number,
  size: number,
): Point {
  const half = size / 2;
  const nearSide = (side: Side): Point => {
    const middle = sideMidpoint(side, size);
    return {
      x: half + (middle.x - half) * 0.56,
      y: half + (middle.y - half) * 0.56,
    };
  };
  if (kind === 'DAIRY') {
    return {x: half, y: half};
  }
  if (kind === 'PASTURE') {
    const halves = (tile.pastures[index]?.halves ?? []).map(item =>
      halfEdgeOf(item, rotation),
    );
    const edges = renderTile(tile, rotation).edges;
    const edge =
      halves.find(item => edges[item.dir] === 'PASTURE') ?? halves[0];
    return edge === undefined
      ? {x: half, y: half}
      : centroid([
          {x: half, y: half},
          cornerPoint(edge, size),
          sideMidpoint(edge.dir, size),
        ]);
  }
  const local =
    kind === 'BAKERY'
      ? tile.bakeries[index]?.sides[0]
      : tile.trails[index]?.sides[0];
  return local === undefined
    ? {x: half, y: half}
    : nearSide(sideOf(local, rotation));
}

/**
 * Точки вывесок: у каждой пекарни с вывеской — у середины её первой стороны, ближе к краю, чем фишка кондитера.
 * Вывеска поворачивается вместе с пекарней и всегда лежит в ней, а не на лугу.
 */
export function signAnchors(
  tile: TileShape,
  rotation: number,
  size: number,
): readonly Point[] {
  const half = size / 2;
  return tile.bakeries.flatMap(bakery => {
    const local = bakery.sides[0];
    if (!bakery.sign || local === undefined) {
      return [];
    }
    const middle = sideMidpoint(sideOf(local, rotation), size);
    return [
      {
        x: half + (middle.x - half) * SIGN_OFFSET,
        y: half + (middle.y - half) * SIGN_OFFSET,
      },
    ];
  });
}

/** Смещение вывески от центра к краю стороны: 0.84 — около 0.08 плитки от края. */
const SIGN_OFFSET = 0.84;

/** Ключ клетки: `x:y` — так же, как id тайла в состоянии. */
export function cellKey(x: number, y: number): string {
  return `${String(x)}:${String(y)}`;
}
