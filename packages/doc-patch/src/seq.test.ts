import {describe, expect, it} from 'vitest';

import {checkSeq} from './seq';

describe('checkSeq', () => {
  it.each([
    ['следующее событие', 5, 6, 'next'],
    ['уже применённое', 5, 5, 'duplicate'],
    ['старее применённого', 5, 3, 'duplicate'],
    ['пропущено событие', 5, 7, 'gap'],
    ['первое после снапшота на 0', 0, 1, 'next'],
  ] as const)('%s', (_, lastSeq, seq, expected) => {
    expect(checkSeq(lastSeq, seq)).toBe(expected);
  });
});
