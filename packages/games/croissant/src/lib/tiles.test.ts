import {describe, expect, it} from 'vitest';

import {
  cellKey,
  halfEdgeOf,
  partOutline,
  renderTile,
  sideOf,
  spotAnchor,
  tileRegions,
  type HalfEdge,
  type TileShape,
} from './tiles';

const half = (dir: HalfEdge['dir'], value: number): HalfEdge => ({
  dir,
  half: value,
});

const BAKERY_ONE: TileShape = {
  code: 'bakery-one',
  title: 'Пекарня',
  edges: ['BAKERY', 'PASTURE', 'PASTURE', 'PASTURE'],
  bakeries: [{sides: ['N'], sign: false}],
  trails: [],
  dairy: false,
  pastures: [
    {
      halves: [
        half('E', 0),
        half('E', 1),
        half('S', 0),
        half('S', 1),
        half('W', 0),
        half('W', 1),
      ],
    },
  ],
};

const TRAIL_STRAIGHT: TileShape = {
  code: 'trail-straight',
  title: 'Прямая тропа',
  edges: ['TRAIL', 'PASTURE', 'TRAIL', 'PASTURE'],
  bakeries: [],
  trails: [{sides: ['N', 'S']}],
  dairy: false,
  pastures: [
    {halves: [half('N', 0), half('W', 0), half('W', 1), half('S', 0)]},
    {halves: [half('N', 1), half('E', 0), half('E', 1), half('S', 1)]},
  ],
};

/** «Две пекарни»: пекарни N и S, тропа E–W между ними, луг у каждой пекарни. */
const BAKERY_TWO: TileShape = {
  code: 'bakery-two',
  title: 'Две пекарни',
  edges: ['BAKERY', 'TRAIL', 'BAKERY', 'TRAIL'],
  bakeries: [
    {sides: ['N'], sign: false},
    {sides: ['S'], sign: false},
  ],
  trails: [{sides: ['E', 'W']}],
  dairy: false,
  pastures: [
    {halves: [half('E', 0), half('W', 0)]},
    {halves: [half('E', 1), half('W', 1)]},
  ],
};

const BAKERY_FOUR: TileShape = {
  code: 'bakery-four',
  title: 'Пекарня-крепость',
  edges: ['BAKERY', 'BAKERY', 'BAKERY', 'BAKERY'],
  bakeries: [{sides: ['N', 'E', 'S', 'W'], sign: true}],
  trails: [],
  dairy: false,
  pastures: [],
};

/** Владельцы восьми треугольников плитки: `<полуребро>:<участок>`. */
const ownersOf = (tile: TileShape, rotation: number): string[] =>
  tileRegions(tile, rotation, 100).areas.map(area => {
    const edge = `${area.edge.dir}${String(area.edge.half)}`;
    return area.owner === null
      ? `${edge}:-`
      : `${edge}:${area.owner.kind}${String(area.owner.index)}`;
  });

describe('renderTile', () => {
  it('keeps the sides of a tile without rotation', () => {
    const tile = renderTile(BAKERY_ONE, 0);
    expect(tile.edges.N).toBe('BAKERY');
    expect(tile.edges.E).toBe('PASTURE');
  });

  it('turns the sides with the rotation', () => {
    expect(renderTile(BAKERY_ONE, 90).edges.E).toBe('BAKERY');
    expect(renderTile(BAKERY_ONE, 180).edges.S).toBe('BAKERY');
    expect(renderTile(BAKERY_ONE, 270).edges.W).toBe('BAKERY');
  });

  it('turns the trail ends with the rotation', () => {
    expect(renderTile(TRAIL_STRAIGHT, 0).trails).toEqual(['N', 'S']);
    expect(renderTile(TRAIL_STRAIGHT, 90).trails).toEqual(['E', 'W']);
  });

  it('counts the signs of the bakeries', () => {
    const signed: TileShape = {
      ...BAKERY_ONE,
      bakeries: [{sides: ['N', 'E'], sign: true}],
    };
    expect(renderTile(signed, 0).signs).toBe(1);
  });
});

describe('sideOf', () => {
  it('maps a catalog side to the absolute one', () => {
    expect(sideOf('N', 0)).toBe('N');
    expect(sideOf('N', 90)).toBe('E');
    expect(sideOf('S', 270)).toBe('E');
  });
});

describe('halfEdgeOf', () => {
  it('turns a half edge clockwise like the server', () => {
    expect(halfEdgeOf(half('N', 1), 0)).toEqual(half('N', 1));
    expect(halfEdgeOf(half('N', 1), 90)).toEqual(half('E', 1));
    expect(halfEdgeOf(half('N', 0), 90)).toEqual(half('E', 0));
    expect(halfEdgeOf(half('E', 0), 90)).toEqual(half('S', 1));
    expect(halfEdgeOf(half('N', 0), 180)).toEqual(half('S', 1));
    expect(halfEdgeOf(half('W', 1), 270)).toEqual(half('S', 1));
  });
});

describe('tileRegions', () => {
  it('splits a tile without rotation between bakeries and pastures', () => {
    expect(ownersOf(BAKERY_TWO, 0)).toEqual([
      'N0:BAKERY0',
      'N1:BAKERY0',
      'E0:PASTURE0',
      'E1:PASTURE1',
      'S0:BAKERY1',
      'S1:BAKERY1',
      'W0:PASTURE0',
      'W1:PASTURE1',
    ]);
  });

  it('turns the parts with the tile', () => {
    // 270°: пекарня N уходит на W, пекарня S — на E, тропа идёт N–S, луг первой пекарни — западная половина.
    expect(ownersOf(BAKERY_TWO, 270)).toEqual([
      'N0:PASTURE0',
      'N1:PASTURE1',
      'E0:BAKERY1',
      'E1:BAKERY1',
      'S0:PASTURE0',
      'S1:PASTURE1',
      'W0:BAKERY0',
      'W1:BAKERY0',
    ]);
    expect(
      tileRegions(BAKERY_TWO, 270, 100).trails.map(trail => trail.to),
    ).toEqual([
      {x: 50, y: 0},
      {x: 50, y: 100},
    ]);
  });

  it('gives a full bakery the whole tile', () => {
    expect(
      tileRegions(BAKERY_FOUR, 0, 100).areas.every(
        area => area.owner?.kind === 'BAKERY',
      ),
    ).toBe(true);
  });

  it('puts the dairy in the center', () => {
    expect(tileRegions({...BAKERY_FOUR, dairy: true}, 0, 100).dairy).toEqual({
      x: 50,
      y: 50,
    });
  });
});

describe('partOutline', () => {
  it('skips the inner joints of one part', () => {
    const {areas} = tileRegions(BAKERY_FOUR, 0, 100);
    // Только край плитки: по одной кромке у каждого из восьми треугольников.
    expect(partOutline(areas, {kind: 'BAKERY', index: 0})).toHaveLength(8);
  });

  it('draws the border between two parts', () => {
    const {areas} = tileRegions(BAKERY_ONE, 0, 100);
    // Пекарня N: две кромки края и два стыка с лугом через «центр — угол».
    expect(partOutline(areas, {kind: 'BAKERY', index: 0})).toHaveLength(4);
  });
});

describe('spotAnchor', () => {
  it('puts a confectioner of a bakery at its side', () => {
    const anchor = spotAnchor(BAKERY_ONE, 0, 'BAKERY', 0, 100);
    expect(anchor.y).toBeLessThan(50);
  });

  it('puts a confectioner of a pasture inside the pasture', () => {
    // Луга «Двух пекарен» при 0°: северные и южные половины сторон E и W.
    expect(spotAnchor(BAKERY_TWO, 0, 'PASTURE', 0, 100).y).toBeLessThan(50);
    expect(spotAnchor(BAKERY_TWO, 0, 'PASTURE', 1, 100).y).toBeGreaterThan(50);
  });

  it('falls back to the center for a missing spot', () => {
    expect(spotAnchor(TRAIL_STRAIGHT, 0, 'TRAIL', 5, 100)).toEqual({
      x: 50,
      y: 50,
    });
  });
});

describe('cellKey', () => {
  it('builds the id of a placed tile', () => {
    expect(cellKey(-2, 3)).toBe('-2:3');
  });
});
