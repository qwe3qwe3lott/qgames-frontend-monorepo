import {describe, expect, it} from 'vitest';

import {cellKey, renderTile, sideOf, spotAnchor, type TileShape} from './tiles';

const BAKERY_ONE: TileShape = {
  code: 'bakery-one',
  title: 'Пекарня',
  edges: ['BAKERY', 'PASTURE', 'PASTURE', 'PASTURE'],
  bakeries: [{sides: ['N'], sign: false}],
  trails: [],
  dairy: false,
};

const TRAIL_STRAIGHT: TileShape = {
  code: 'trail-straight',
  title: 'Прямая тропа',
  edges: ['TRAIL', 'PASTURE', 'TRAIL', 'PASTURE'],
  bakeries: [],
  trails: [{sides: ['N', 'S']}],
  dairy: false,
};

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

describe('spotAnchor', () => {
  it('puts a confectioner of a bakery at its side', () => {
    const anchor = spotAnchor(BAKERY_ONE, 0, 'BAKERY', 0, 100);
    expect(anchor.y).toBeLessThan(50);
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
