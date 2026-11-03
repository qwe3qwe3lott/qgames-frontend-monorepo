// Рисунок тайла из модели каталога: плоский граф (край плитки, кромки пекарен, линии троп) и его грани — пекарни
// и луга. Всё считается в базовой ориентации каталога, поворот делает transform группы при рисовании. Правил игры
// здесь нет: только форма частей тайла.

import {
  SIDES,
  partKey,
  type HalfEdge,
  type Point,
  type Side,
  type TilePart,
  type TileShape,
} from './tiles';

/** Часть тайла — грань графа: контур (SVG path) и точка для фишки. */
export interface TileFace {
  readonly part: TilePart;
  readonly d: string;
  readonly points: readonly Point[];
  readonly anchor: Point;
}

/** Тропа тайла: ломаная (SVG path) и точка для фишки на её середине. */
export interface TileTrail {
  readonly part: TilePart;
  readonly d: string;
  readonly anchor: Point;
}

/** Кружок в центре тайла: сыроварня или сад. */
export interface TileCircle {
  readonly center: Point;
  readonly r: number;
}

/** Геометрия тайла размера `size` в базовой ориентации. */
export interface TileGeometry {
  readonly faces: readonly TileFace[];
  readonly trails: readonly TileTrail[];
  readonly dairy: TileCircle | null;
  readonly garden: TileCircle | null;
  readonly signs: readonly Point[];
  /** Точка фишки по ключу части (`partKey`). */
  readonly anchors: ReadonlyMap<string, Point>;
}

/** Глубина купола кромки пекарни у одной стороны, в долях плитки. */
const DOME_DEPTH = 0.3;
/** Доля хорды, на которой купол поднимается от угла: наклон у угла 2·DOME_DEPTH/DOME_RISE < 1, купола соседних сторон не пересекаются. */
const DOME_RISE = 0.65;
/** Прогиб диагональной кромки угловой пекарни к пекарне: оставляет клин луга до купола соседней стороны. */
const DIAGONAL_BEND = 0.06;
/** Отрезков на кривую. Чётное — середина кривой попадает в вершину (в неё входят тропы). */
const CURVE_STEPS = 16;
/** Радиус сыроварни и сада, в долях плитки. */
export const DAIRY_RADIUS = 0.16;
export const GARDEN_RADIUS = 0.13;
/** Смещение вывески от центра к краю стороны: 0.84 — около 0.08 плитки от края. */
const SIGN_OFFSET = 0.84;
/** Сторона квадрата вывески в долях плитки. */
export const SIGN_SIZE = 0.1;

const CENTER: Point = {x: 0.5, y: 0.5};

/** Углы стороны по часовой стрелке (ось Y вниз, как в SVG): от начала стороны к концу. */
const SIDE_CORNERS: Readonly<Record<Side, readonly [Point, Point]>> = {
  N: [
    {x: 0, y: 0},
    {x: 1, y: 0},
  ],
  E: [
    {x: 1, y: 0},
    {x: 1, y: 1},
  ],
  S: [
    {x: 1, y: 1},
    {x: 0, y: 1},
  ],
  W: [
    {x: 0, y: 1},
    {x: 0, y: 0},
  ],
};

function midpoint(side: Side): Point {
  const [a, b] = SIDE_CORNERS[side];
  return {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2};
}

/**
 * Половина стороны по ходу часовой стрелки: у N и S `half` 0 — западная, у E и W — северная (как в контракте). Ход
 * по часовой стрелке идёт у N и E от half 0 к 1, у S и W — от 1 к 0.
 */
function halvesInOrder(side: Side): readonly [HalfEdge, HalfEdge] {
  return side === 'N' || side === 'E'
    ? [
        {dir: side, half: 0},
        {dir: side, half: 1},
      ]
    : [
        {dir: side, half: 1},
        {dir: side, half: 0},
      ];
}

/** Тег ребра графа: край плитки (полуребро), кромка пекарни или тропа. */
type EdgeTag =
  | {readonly kind: 'border'; readonly half: HalfEdge}
  | {readonly kind: 'bakery'}
  | {readonly kind: 'trail'};

interface Graph {
  readonly points: Map<string, Point>;
  readonly adjacency: Map<string, Map<string, EdgeTag>>;
}

/** Ключ вершины: округление сшивает концы кривых, сходящихся в одной точке. */
function keyOf(point: Point): string {
  return `${String(Math.round(point.x * 1e4))}:${String(Math.round(point.y * 1e4))}`;
}

function addPolyline(graph: Graph, line: readonly Point[], tag: EdgeTag) {
  for (let i = 0; i + 1 < line.length; i++) {
    const a = line[i];
    const b = line[i + 1];
    if (a === undefined || b === undefined) {
      continue;
    }
    const ka = keyOf(a);
    const kb = keyOf(b);
    if (ka === kb) {
      continue;
    }
    graph.points.set(ka, a);
    graph.points.set(kb, b);
    const from = graph.adjacency.get(ka) ?? new Map<string, EdgeTag>();
    const to = graph.adjacency.get(kb) ?? new Map<string, EdgeTag>();
    from.set(kb, tag);
    to.set(ka, tag);
    graph.adjacency.set(ka, from);
    graph.adjacency.set(kb, to);
  }
}

/**
 * Купол от `from` до `to`: прогиб по нормали `normal` с профилем `depth · (2u − u²)`, где u растёт от концов к
 * середине (u = 1 на расстоянии `DOME_RISE` от конца). Профиль плавный, а у концов наклон меньше 45°: купола соседних сторон расходятся.
 */
function dome(from: Point, to: Point, normal: Point, depth: number): Point[] {
  return Array.from({length: CURVE_STEPS + 1}, (_, step) => {
    const t = step / CURVE_STEPS;
    const u = Math.min(1, Math.min(t, 1 - t) / DOME_RISE);
    const lift = depth * (2 * u - u * u);
    return {
      x: from.x + (to.x - from.x) * t + normal.x * lift,
      y: from.y + (to.y - from.y) * t + normal.y * lift,
    };
  });
}

/** Квадратичная кривая Безье, разбитая на отрезки. */
function bezier(from: Point, control: Point, to: Point): Point[] {
  return Array.from({length: CURVE_STEPS + 1}, (_, step) => {
    const t = step / CURVE_STEPS;
    const a = (1 - t) * (1 - t);
    const b = 2 * t * (1 - t);
    const c = t * t;
    return {
      x: a * from.x + b * control.x + c * to.x,
      y: a * from.y + b * control.y + c * to.y,
    };
  });
}

function unit(vector: Point): Point {
  const length = Math.hypot(vector.x, vector.y);
  return {x: vector.x / length, y: vector.y / length};
}

function nextSide(side: Side): Side {
  return SIDES[(SIDES.indexOf(side) + 1) % 4] ?? 'N';
}

/**
 * Кромки пекарни: по одной на каждый разрыв — подряд идущие стороны не этой пекарни. Кромка соединяет углы разрыва:
 * разрыв в одну сторону — купол внутрь от неё (луг-колпак), в три стороны — купол внутрь от стороны пекарни
 * (пекарня-колпак), в две — диагональ, чуть прогнутая к пекарне.
 */
function bakeryEdges(sides: readonly Side[]): {
  readonly gap: readonly Side[];
  readonly line: readonly Point[];
}[] {
  const own = new Set(sides);
  if (own.size === 4) {
    return [];
  }
  const start = SIDES.find(side => own.has(side) && !own.has(nextSide(side)));
  if (start === undefined) {
    return [];
  }
  const edges: {gap: Side[]; line: Point[]}[] = [];
  let side = nextSide(start);
  for (let step = 0; step < 4; step++) {
    if (own.has(side)) {
      side = nextSide(side);
      continue;
    }
    const gap: Side[] = [];
    while (!own.has(side)) {
      gap.push(side);
      side = nextSide(side);
    }
    step += gap.length - 1;
    const first = gap[0] ?? 'N';
    const last = gap[gap.length - 1] ?? 'N';
    const from = SIDE_CORNERS[first][0];
    const to = SIDE_CORNERS[last][1];
    if (gap.length === 2) {
      // Нормаль хорды к углу пекарни: он напротив угла разрыва.
      const gapCorner = SIDE_CORNERS[first][1];
      const normal = unit({x: 0.5 - gapCorner.x, y: 0.5 - gapCorner.y});
      edges.push({gap, line: dome(from, to, normal, DIAGONAL_BEND)});
    } else {
      // Хорда — одна сторона: разрыва (луг-колпак) или пекарни (пекарня-колпак); купол — к центру.
      const chordSide = gap.length === 1 ? first : nextSide(last);
      const middle = midpoint(chordSide);
      const normal = unit({x: 0.5 - middle.x, y: 0.5 - middle.y});
      edges.push({gap, line: dome(from, to, normal, DOME_DEPTH)});
    }
  }
  return edges;
}

/** Ломаная тропы: от середины стороны к цели, между сторонами — прямая или дуга мимо центра. */
function trailLines(
  trail: TileShape['trails'][number],
  bakeryLines: readonly {
    readonly gap: readonly Side[];
    readonly line: readonly Point[];
  }[][],
): Point[][] {
  const [first, second] = trail.sides;
  if (first === undefined) {
    return [];
  }
  if (trail.sides.length === 1) {
    const from = midpoint(first);
    if (trail.bakery !== undefined && trail.bakery !== null) {
      const edge = bakeryLines[trail.bakery]?.find(item =>
        item.gap.includes(first),
      );
      const target = edge?.line[CURVE_STEPS / 2] ?? CENTER;
      return [[from, target]];
    }
    return [[from, CENTER]];
  }
  if (trail.sides.length === 2 && second !== undefined) {
    const opposite = SIDES.indexOf(first) % 2 === SIDES.indexOf(second) % 2;
    return opposite
      ? [[midpoint(first), CENTER, midpoint(second)]]
      : [bezier(midpoint(first), CENTER, midpoint(second))];
  }
  return trail.sides.map(side => [midpoint(side), CENTER]);
}

/** Знаковая площадь многоугольника (в SVG положительна при обходе по часовой стрелке). */
function signedArea(points: readonly Point[]): number {
  let area = 0;
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length] ?? point;
    area += point.x * next.y - next.x * point.y;
  });
  return area / 2;
}

/**
 * Грани графа: обход полурёбер, на каждой вершине — следующее ребро по углу. Висячие рёбра (тропа в сыроварню)
 * обходятся туда и обратно и остаются внутри своей грани. Внешняя грань (обход края плитки снаружи) отбрасывается.
 */
function faces(graph: Graph): {keys: string[]; tags: EdgeTag[]}[] {
  const sorted = new Map<string, string[]>();
  graph.adjacency.forEach((neighbours, key) => {
    const origin = graph.points.get(key) ?? CENTER;
    sorted.set(
      key,
      [...neighbours.keys()].sort((a, b) => {
        const pa = graph.points.get(a) ?? CENTER;
        const pb = graph.points.get(b) ?? CENTER;
        return (
          Math.atan2(pa.y - origin.y, pa.x - origin.x) -
          Math.atan2(pb.y - origin.y, pb.x - origin.x)
        );
      }),
    );
  });
  const visited = new Set<string>();
  const result: {keys: string[]; tags: EdgeTag[]}[] = [];
  graph.adjacency.forEach((neighbours, start) => {
    neighbours.forEach((_, next) => {
      if (visited.has(`${start}>${next}`)) {
        return;
      }
      const keys: string[] = [];
      const tags: EdgeTag[] = [];
      let from = start;
      let to = next;
      while (!visited.has(`${from}>${to}`)) {
        visited.add(`${from}>${to}`);
        keys.push(from);
        const tag = graph.adjacency.get(from)?.get(to);
        if (tag !== undefined) {
          tags.push(tag);
        }
        const around = sorted.get(to) ?? [];
        const back = around.indexOf(from);
        const following =
          around[(back - 1 + around.length) % around.length] ?? from;
        from = to;
        to = following;
      }
      result.push({keys, tags});
    });
  });
  return result.filter(face => {
    const points = face.keys.map(key => graph.points.get(key) ?? CENTER);
    return signedArea(points) > 1e-9;
  });
}

function sameHalf(a: HalfEdge, b: HalfEdge): boolean {
  return a.dir === b.dir && a.half === b.half;
}

/** Владелец грани: пекарня её стороны или луг её полуребер; null — грань без края плитки. */
function ownerOf(tile: TileShape, tags: readonly EdgeTag[]): TilePart | null {
  for (const tag of tags) {
    if (tag.kind !== 'border') {
      continue;
    }
    const bakery = tile.bakeries.findIndex(item =>
      item.sides.includes(tag.half.dir),
    );
    if (bakery >= 0) {
      return {kind: 'BAKERY', index: bakery};
    }
    const pasture = tile.pastures.findIndex(item =>
      item.halves.some(half => sameHalf(half, tag.half)),
    );
    if (pasture >= 0) {
      return {kind: 'PASTURE', index: pasture};
    }
  }
  return null;
}

function contains(points: readonly Point[], point: Point): boolean {
  let inside = false;
  points.forEach((a, index) => {
    const b = points[(index + 1) % points.length] ?? a;
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    ) {
      inside = !inside;
    }
  });
  return inside;
}

function segmentDistance(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = dx * dx + dy * dy;
  const t =
    length === 0
      ? 0
      : Math.max(
          0,
          Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length),
        );
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}

/**
 * Точка для фишки внутри грани: узел сетки, дальше всего от её границы, троп, кружка в центре и вывесок. Граней на
 * тайле несколько, сетка мелкая — перебор дешёвый, а результат кешируется вместе с геометрией.
 */
function interiorPoint(
  points: readonly Point[],
  obstacles: {
    readonly lines: readonly (readonly Point[])[];
    readonly circle: TileCircle | null;
    readonly signs: readonly Point[];
  },
): Point {
  const STEPS = 40;
  let best: Point = points[0] ?? CENTER;
  let bestScore = -Infinity;
  for (let i = 1; i < STEPS; i++) {
    for (let j = 1; j < STEPS; j++) {
      const point = {x: i / STEPS, y: j / STEPS};
      if (!contains(points, point)) {
        continue;
      }
      let score = Infinity;
      points.forEach((a, index) => {
        score = Math.min(
          score,
          segmentDistance(point, a, points[(index + 1) % points.length] ?? a),
        );
      });
      obstacles.lines.forEach(line => {
        line.forEach((a, index) => {
          const b = line[index + 1];
          if (b !== undefined) {
            score = Math.min(score, segmentDistance(point, a, b));
          }
        });
      });
      if (obstacles.circle !== null) {
        score = Math.min(
          score,
          Math.hypot(
            point.x - obstacles.circle.center.x,
            point.y - obstacles.circle.center.y,
          ) - obstacles.circle.r,
        );
      }
      obstacles.signs.forEach(sign => {
        score = Math.min(
          score,
          Math.hypot(point.x - sign.x, point.y - sign.y) - SIGN_SIZE,
        );
      });
      if (score > bestScore) {
        bestScore = score;
        best = point;
      }
    }
  }
  return best;
}

/** Середина ломаной по длине. */
function lineMiddle(lines: readonly (readonly Point[])[]): Point {
  const segments = lines.flatMap(line =>
    line.slice(1).map((b, index) => [line[index] ?? b, b] as const),
  );
  const total = segments.reduce(
    (sum, [a, b]) => sum + Math.hypot(b.x - a.x, b.y - a.y),
    0,
  );
  let left = total / 2;
  for (const [a, b] of segments) {
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (left <= length && length > 0) {
      const t = left / length;
      return {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t};
    }
    left -= length;
  }
  return CENTER;
}

function scale(point: Point, size: number): Point {
  return {x: point.x * size, y: point.y * size};
}

function pathOf(
  points: readonly Point[],
  size: number,
  closed: boolean,
): string {
  const body = points
    .map((point, index) => {
      const scaled = scale(point, size);
      return `${index === 0 ? 'M' : 'L'}${scaled.x.toFixed(2)},${scaled.y.toFixed(2)}`;
    })
    .join(' ');
  return closed ? `${body} Z` : body;
}

/** Элементы тайла, из которых строится граф: без лугов (они выводятся из граней). */
type TileLayout = Omit<TileShape, 'pastures'>;

/** Плоский граф тайла: края плитки по полуребрам, кромки пекарен и тропы. */
function buildGraph(tile: TileLayout): {
  readonly graph: Graph;
  readonly trailPaths: readonly Point[][][];
} {
  const graph: Graph = {points: new Map(), adjacency: new Map()};
  SIDES.forEach(side => {
    const [start, end] = SIDE_CORNERS[side];
    const [first, second] = halvesInOrder(side);
    addPolyline(graph, [start, midpoint(side)], {kind: 'border', half: first});
    addPolyline(graph, [midpoint(side), end], {kind: 'border', half: second});
  });
  const bakeryLines = tile.bakeries.map(bakery => bakeryEdges(bakery.sides));
  bakeryLines.forEach(edges => {
    edges.forEach(edge => {
      addPolyline(graph, edge.line, {kind: 'bakery'});
    });
  });
  const trailPaths = tile.trails.map(trail => trailLines(trail, bakeryLines));
  trailPaths.forEach(lines => {
    lines.forEach(line => {
      addPolyline(graph, line, {kind: 'trail'});
    });
  });
  return {graph, trailPaths};
}

/**
 * Луга тайла, выведенные из пекарен и троп: грань графа, выходящая к краю плитки не стороной пекарни, — луг с её
 * полуребрами. Грань без края (замкнутая тропами) лугом не считается, как в `ownerOf`.
 */
export function pastureHalves(tile: TileLayout): TileShape['pastures'] {
  const bakerySides = new Set(tile.bakeries.flatMap(bakery => bakery.sides));
  return faces(buildGraph(tile).graph).flatMap(face => {
    const halves = face.tags.flatMap(tag =>
      tag.kind === 'border' && !bakerySides.has(tag.half.dir) ? [tag.half] : [],
    );
    return halves.length === 0 ? [] : [{halves}];
  });
}

function buildGeometry(tile: TileShape, size: number): TileGeometry {
  const {graph, trailPaths} = buildGraph(tile);

  const dairy = tile.dairy ? {center: CENTER, r: DAIRY_RADIUS} : null;
  const garden = tile.garden ? {center: CENTER, r: GARDEN_RADIUS} : null;
  const signs = tile.bakeries.flatMap(bakery => {
    const side = bakery.sides[0];
    if (!bakery.sign || side === undefined) {
      return [];
    }
    const middle = midpoint(side);
    return [
      {
        x: 0.5 + (middle.x - 0.5) * SIGN_OFFSET,
        y: 0.5 + (middle.y - 0.5) * SIGN_OFFSET,
      },
    ];
  });
  const obstacles = {
    lines: trailPaths.flat(),
    circle: dairy ?? garden,
    signs,
  };

  const anchors = new Map<string, Point>();
  const tileFaces: TileFace[] = [];
  faces(graph).forEach(face => {
    const part = ownerOf(tile, face.tags);
    if (part === null) {
      return;
    }
    const points = face.keys.map(key => graph.points.get(key) ?? CENTER);
    const anchor = interiorPoint(points, obstacles);
    if (!anchors.has(partKey(part))) {
      anchors.set(partKey(part), scale(anchor, size));
    }
    tileFaces.push({
      part,
      d: pathOf(points, size, true),
      points: points.map(point => scale(point, size)),
      anchor: scale(anchor, size),
    });
  });
  const trails = trailPaths.map((lines, index) => {
    const part: TilePart = {kind: 'TRAIL', index};
    const anchor = scale(lineMiddle(lines), size);
    anchors.set(partKey(part), anchor);
    return {
      part,
      d: lines.map(line => pathOf(line, size, false)).join(' '),
      anchor,
    };
  });
  if (dairy !== null) {
    anchors.set(partKey({kind: 'DAIRY', index: 0}), scale(CENTER, size));
  }
  return {
    faces: tileFaces,
    trails,
    dairy:
      dairy === null ? null : {center: scale(CENTER, size), r: dairy.r * size},
    garden:
      garden === null
        ? null
        : {center: scale(CENTER, size), r: garden.r * size},
    signs: signs.map(sign => scale(sign, size)),
    anchors,
  };
}

const cache = new Map<string, TileGeometry>();

/** Геометрия тайла в базовой ориентации; кешируется по коду типа и размеру. */
export function tileGeometry(tile: TileShape, size: number): TileGeometry {
  const key = `${tile.code}@${String(size)}`;
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const geometry = buildGeometry(tile, size);
  cache.set(key, geometry);
  return geometry;
}
