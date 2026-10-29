import {describe, expect, it} from 'vitest';

import {applyPatch, type PatchEvent, type PathSegment} from './patch';

// Те же сценарии, что DocumentPatchScenariosTest бэкенда: применители обязаны
// совпадать, иначе клиент тихо разойдётся с сервером.

function player(id: string, moveOptions: readonly unknown[]) {
  return {id, moveOptions};
}

const ALICE = player('a', [{type: 'PASS', data: null}]);
const BOB = player('b', []);

const STATE = {
  players: [ALICE, BOB],
  timer: {status: 'RUNNING', deadline: '2026-10-21T10:00:30Z', pausedAt: null},
  moves: 0,
};

const DOCUMENT = {
  status: 'IN_PROGRESS',
  meta: {game: {code: 'nothing'}},
  state: STATE,
};

function withState(changes: Record<string, unknown>) {
  return {...DOCUMENT, state: {...STATE, ...changes}};
}

const id = (value: string): PathSegment => ({id: value});

function put(path: PathSegment[], value: unknown, code = 'c'): PatchEvent {
  return {method: 'PUT', code, data: {path, value}};
}

function patch(
  path: PathSegment[],
  value: Record<string, unknown>,
  code = 'c',
): PatchEvent {
  return {method: 'PATCH', code, data: {path, value}};
}

function del(path: PathSegment[], code = 'c'): PatchEvent {
  return {method: 'DELETE', code, data: {path}};
}

function childOf(document: unknown, key: string): unknown {
  return typeof document === 'object' && document !== null
    ? Object.getOwnPropertyDescriptor(document, key)?.value
    : undefined;
}

function keysOf(document: unknown, key: string): string[] {
  const child = childOf(document, key);
  return typeof child === 'object' && child !== null ? Object.keys(child) : [];
}

describe('applyPatch: событие меняет документ', () => {
  const stateWithoutTimer = {players: STATE.players, moves: STATE.moves};

  it.each<[string, PatchEvent, unknown]>([
    [
      'PUT replaces a value',
      put(['state', 'timer'], {
        status: 'STOPPED',
        deadline: null,
        pausedAt: null,
      }),
      withState({timer: {status: 'STOPPED', deadline: null, pausedAt: null}}),
    ],
    [
      'PUT creates a missing key',
      put(['state', 'turns'], {round: 1}),
      withState({turns: {round: 1}}),
    ],
    [
      'PUT writes null',
      put(['state', 'timer'], null),
      withState({timer: null}),
    ],
    [
      'PUT replaces a field of an array element by id',
      put(['state', 'players', id('b'), 'moveOptions'], [{type: 'PASS'}]),
      withState({players: [ALICE, player('b', [{type: 'PASS'}])]}),
    ],
    [
      'PUT by a missing id appends to the array',
      put(['state', 'players', id('c')], player('c', [])),
      withState({players: [ALICE, BOB, player('c', [])]}),
    ],
    [
      'PUT by an existing id replaces the element in place',
      put(['state', 'players', id('a')], player('a', [])),
      withState({players: [player('a', []), BOB]}),
    ],
    [
      'PATCH is shallow: fields are replaced, nested values as a whole, null is a value',
      patch(['state', 'timer'], {
        status: 'PAUSED',
        deadline: null,
        extra: {x: 1},
      }),
      withState({
        timer: {
          status: 'PAUSED',
          deadline: null,
          pausedAt: null,
          extra: {x: 1},
        },
      }),
    ],
    [
      'PATCH of the root',
      patch([], {status: 'CANCELLED'}),
      {...DOCUMENT, status: 'CANCELLED'},
    ],
    ['PATCH of the state', patch(['state'], {moves: 1}), withState({moves: 1})],
    [
      'DELETE removes a key',
      del(['state', 'timer']),
      {...DOCUMENT, state: stateWithoutTimer},
    ],
    [
      'DELETE removes an array element by id',
      del(['state', 'players', id('a')]),
      withState({players: [BOB]}),
    ],
    [
      'INFO does not change the document',
      {method: 'INFO', code: 'player-passed'},
      DOCUMENT,
    ],
  ])('%s', (_, event, expected) => {
    expect(applyPatch(DOCUMENT, event)).toEqual({ok: true, document: expected});
  });

  it('source document is not changed and the key order is kept', () => {
    const before = JSON.stringify(DOCUMENT);

    const result = applyPatch(
      DOCUMENT,
      put(['state', 'timer'], {status: 'STOPPED'}),
    );

    expect(JSON.stringify(DOCUMENT)).toBe(before);
    expect(result).toMatchObject({ok: true});
    expect(result.ok && keysOf(result.document, 'state')).toEqual([
      'players',
      'timer',
      'moves',
    ]);
  });

  it('unchanged branches are reused', () => {
    const result = applyPatch(DOCUMENT, patch(['state'], {moves: 1}));

    expect(result.ok && childOf(result.document, 'meta')).toBe(DOCUMENT.meta);
  });
});

describe('applyPatch: событие не подходит документу', () => {
  it.each<[string, unknown, PatchEvent]>([
    ['PUT under a missing key', DOCUMENT, put(['state', 'turns', 'round'], 1)],
    [
      'PUT under a missing id',
      DOCUMENT,
      put(['state', 'players', id('x'), 'moveOptions'], []),
    ],
    [
      'PUT of a new element without the same id',
      DOCUMENT,
      put(['state', 'players', id('x')], player('y', [])),
    ],
    ['PUT by id into an object', DOCUMENT, put(['state', id('a')], 1)],
    ['PUT by key into an array', DOCUMENT, put(['state', 'players', 'a'], 1)],
    ['PUT replaces the root with a non-object', DOCUMENT, put([], [1])],
    ['PUT without value', DOCUMENT, put(['state', 'moves'], undefined)],
    ['PATCH of a missing key', DOCUMENT, patch(['state', 'turns'], {round: 2})],
    ['PATCH of a non-object', DOCUMENT, patch(['state', 'moves'], {x: 1})],
    [
      'PATCH with a non-object value',
      DOCUMENT,
      // Значение не по контракту (сервер так не шлёт): проверяется сам применитель.
      Object.assign(patch(['state'], {}), {data: {path: ['state'], value: 1}}),
    ],
    ['DELETE of a missing key', DOCUMENT, del(['state', 'turns'])],
    ['DELETE of a missing id', DOCUMENT, del(['state', 'players', id('x')])],
    ['DELETE of the root', DOCUMENT, del([])],
  ])('%s', (_, document, event) => {
    const result = applyPatch(document, event);

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain(`${event.method} c`);
  });
});
