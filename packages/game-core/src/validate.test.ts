import {describe, expect, it} from 'vitest';

import {parseSessionDocument} from './validate';
import {DOCUMENT, META, STATE} from './testData';

const ANY_GAME = {isGameState: () => true};

describe('parseSessionDocument', () => {
  it('документ по контракту', () => {
    expect(parseSessionDocument(DOCUMENT, ANY_GAME)).toEqual(DOCUMENT);
  });

  it('advancedRules игры переносятся как есть', () => {
    const rules = {board: 8, flyingKings: true};

    expect(
      parseSessionDocument(
        {...DOCUMENT, meta: {...META, advancedRules: rules}},
        ANY_GAME,
      )?.meta.advancedRules,
    ).toBe(rules);
  });

  it.each<[string, unknown]>([
    ['не объект', [DOCUMENT]],
    ['неизвестный статус', {...DOCUMENT, status: 'PAUSED'}],
    ['нет meta', {...DOCUMENT, meta: undefined}],
    [
      'неизвестная игра',
      {...DOCUMENT, meta: {game: {...META.game, code: 'chess'}}},
    ],
    ['состояние не объект', {...DOCUMENT, state: []}],
    ['блоки core не по схеме', {...DOCUMENT, state: {...STATE, turns: null}}],
  ])('не по контракту: %s', (_, value) => {
    expect(parseSessionDocument(value, ANY_GAME)).toBeNull();
  });

  it('поля игры проверяет guard игры', () => {
    expect(
      parseSessionDocument(DOCUMENT, {isGameState: () => false}),
    ).toBeNull();
  });
});
