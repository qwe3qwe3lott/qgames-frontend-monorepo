import {describe, expect, it} from 'vitest';

import catalog from './catalog.fixture.json';
import {tileGeometry, type TileFace} from './tileGeometry';
import {partKey, type HalfEdge, type Side, type TileShape} from './tiles';

// Каталог — снимок `GET /api/games/croissant` → `assets.tiles`: геометрия проверяется на реальных типах тайлов.
const TILES = catalog as TileShape[];

const half = (dir: Side, value: number): HalfEdge => ({dir, half: value});
const trail = (
  sides: Side[],
  target: {bakery?: number; dairy?: boolean; garden?: boolean} = {},
) => ({
  sides,
  bakery: target.bakery ?? null,
  dairy: target.dairy ?? false,
  garden: target.garden ?? false,
});

/** Две независимые дуги W-N и S-E: уголки NW и SE и большой луг между ними. */
const TWO_CURVES: TileShape = {
  code: 'test-two-curves',
  title: 'Две дуги',
  edges: ['TRAIL', 'TRAIL', 'TRAIL', 'TRAIL'],
  bakeries: [],
  trails: [trail(['W', 'N']), trail(['S', 'E'])],
  dairy: false,
  garden: false,
  pastures: [
    {halves: [half('W', 0), half('N', 0)]},
    {halves: [half('N', 1), half('E', 0), half('S', 0), half('W', 1)]},
    {halves: [half('E', 1), half('S', 1)]},
  ],
};

/** Раздельные пекарни N и E, тропы W→N и S→E. */
const TWO_BAKERIES: TileShape = {
  code: 'test-two-bakeries',
  title: 'Две пекарни',
  edges: ['BAKERY', 'BAKERY', 'TRAIL', 'TRAIL'],
  bakeries: [
    {sides: ['N'], sign: false},
    {sides: ['E'], sign: true},
  ],
  trails: [trail(['W'], {bakery: 0}), trail(['S'], {bakery: 1})],
  dairy: false,
  garden: false,
  pastures: [
    {halves: [half('W', 0)]},
    {halves: [half('W', 1), half('S', 0)]},
    {halves: [half('S', 1)]},
  ],
};

/** Тропа W→пекарня N, тропа S→сыроварня, отдельная пекарня E. */
const BAKERY_DAIRY: TileShape = {
  code: 'test-bakery-dairy',
  title: 'Пекарни и сыроварня',
  edges: ['BAKERY', 'BAKERY', 'TRAIL', 'TRAIL'],
  bakeries: [
    {sides: ['N'], sign: false},
    {sides: ['E'], sign: false},
  ],
  trails: [trail(['W'], {bakery: 0}), trail(['S'], {dairy: true})],
  dairy: true,
  garden: false,
  pastures: [
    {halves: [half('W', 0)]},
    {halves: [half('W', 1), half('S', 0), half('S', 1)]},
  ],
};

const facesOf = (tile: TileShape) => tileGeometry(tile, 100).faces;
const keysOf = (faces: readonly TileFace[]) =>
  faces.map(face => partKey(face.part)).sort();

/** Общие вершины двух граней (в px, с округлением). */
function sharedPoints(a: TileFace, b: TileFace): string[] {
  const key = (point: {x: number; y: number}) =>
    `${point.x.toFixed(1)}:${point.y.toFixed(1)}`;
  const other = new Set(b.points.map(key));
  return [...new Set(a.points.map(key))].filter(point => other.has(point));
}

describe('tileGeometry', () => {
  it.each(TILES.map(tile => [tile.code, tile] as const))(
    '%s: each bakery and pasture is one face',
    (_, tile) => {
      const expected = [
        ...tile.bakeries.map((__, index) => `BAKERY:${String(index)}`),
        ...tile.pastures.map((__, index) => `PASTURE:${String(index)}`),
      ].sort();
      expect(keysOf(facesOf(tile))).toEqual(expected);
    },
  );

  it.each(TILES.map(tile => [tile.code, tile] as const))(
    '%s: faces fill the whole tile',
    (_, tile) => {
      const area = facesOf(tile).reduce((sum, face) => {
        let doubled = 0;
        face.points.forEach((point, index) => {
          const next = face.points[(index + 1) % face.points.length] ?? point;
          doubled += point.x * next.y - next.x * point.y;
        });
        return sum + doubled / 2;
      }, 0);
      expect(area).toBeCloseTo(100 * 100, 0);
    },
  );

  it('keeps two curves apart: three pastures, the trails do not meet', () => {
    const geometry = tileGeometry(TWO_CURVES, 100);
    expect(keysOf(geometry.faces)).toEqual([
      'PASTURE:0',
      'PASTURE:1',
      'PASTURE:2',
    ]);
    const [first, second] = geometry.trails;
    expect(first?.d).not.toContain('50.00,50.00');
    expect(second?.d).not.toContain('50.00,50.00');
  });

  it('draws separate bakeries on neighbour sides as shapes touching only at the corner', () => {
    const faces = facesOf(TWO_BAKERIES);
    expect(keysOf(faces)).toEqual([
      'BAKERY:0',
      'BAKERY:1',
      'PASTURE:0',
      'PASTURE:1',
      'PASTURE:2',
    ]);
    const north = faces.find(face => partKey(face.part) === 'BAKERY:0');
    const east = faces.find(face => partKey(face.part) === 'BAKERY:1');
    expect(north && east && sharedPoints(north, east)).toEqual(['100.0:0.0']);
  });

  it('leads trails into their bakery and the dairy', () => {
    const geometry = tileGeometry(BAKERY_DAIRY, 100);
    expect(keysOf(geometry.faces)).toEqual([
      'BAKERY:0',
      'BAKERY:1',
      'PASTURE:0',
      'PASTURE:1',
    ]);
    expect(geometry.dairy?.center).toEqual({x: 50, y: 50});
    expect(geometry.trails[1]?.d).toBe('M50.00,100.00 L50.00,50.00');
    expect(geometry.anchors.get('DAIRY:0')).toEqual({x: 50, y: 50});
  });

  it('ends the fork branches at the garden and splits three pastures', () => {
    const fork = TILES.find(tile => tile.code === 'trail-cross');
    const geometry = fork === undefined ? null : tileGeometry(fork, 100);
    expect(geometry?.garden?.center).toEqual({x: 50, y: 50});
    expect(geometry?.trails).toHaveLength(3);
    expect(geometry?.faces).toHaveLength(3);
  });

  it('puts every anchor inside its own face', () => {
    TILES.forEach(tile => {
      tileGeometry(tile, 100).faces.forEach(face => {
        expect(face.anchor.x).toBeGreaterThan(0);
        expect(face.anchor.x).toBeLessThan(100);
        expect(face.anchor.y).toBeGreaterThan(0);
        expect(face.anchor.y).toBeLessThan(100);
      });
    });
  });
});
