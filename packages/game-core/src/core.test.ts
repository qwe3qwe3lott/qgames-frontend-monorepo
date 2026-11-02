import {describe, expect, it} from 'vitest';

import {SessionSnapshotDto} from '@qgames/api/portal/zod';

import {
  activeTimer,
  isCoreState,
  moveOptionsOf,
  playerClock,
  stageClock,
  type ActiveTimer,
} from './core';
import {sessionFromSnapshot, type SessionData} from './session';
import {parseSessionDocument} from './validate';
import {ALICE, BOB, DOCUMENT, META, STATE, TIMER} from './testData';

const ANY_GAME = {isGameState: () => true};

function session(changes: Partial<SessionData> = {}): SessionData {
  const document = parseSessionDocument(DOCUMENT, ANY_GAME);
  if (document === null) {
    throw new Error('тестовый документ не по контракту');
  }
  return {...document, seq: 1, clockOffsetMs: 0, ...changes};
}

describe('isCoreState', () => {
  it.each<[string, Record<string, unknown>, boolean]>([
    ['все блоки core', STATE, true],
    [
      'партия без таймера и итога',
      {...STATE, timer: null, result: undefined},
      true,
    ],
    ['поля игры не проверяются', {...STATE, moves: 'много'}, true],
    ['нет игроков', {...STATE, players: undefined}, false],
    ['игрок без moveOptions', {...STATE, players: [{id: ALICE}]}, false],
    ['нет очерёдности', {...STATE, turns: undefined}, false],
    [
      'неизвестный статус часов',
      {...STATE, timer: {...TIMER, status: 'LOST'}},
      false,
    ],
    ['итог не по схеме', {...STATE, result: {outcome: 1}}, false],
  ])('%s', (_, state, expected) => {
    expect(isCoreState(state)).toBe(expected);
  });
});

describe('moveOptionsOf', () => {
  const state = session().state;

  it('ходы игрока', () => {
    expect(isCoreState(state) && moveOptionsOf(state, ALICE)).toEqual([
      {type: 'PASS'},
    ]);
  });

  it('у не-игрока ходов нет', () => {
    expect(isCoreState(state) && moveOptionsOf(state, 'stranger')).toEqual([]);
  });
});

describe('activeTimer', () => {
  it('идущие часы', () => {
    expect(activeTimer(session())).toEqual({
      kind: 'PLAYERS',
      paused: false,
      deadline: TIMER.deadline,
      pausedAt: null,
      clocks: TIMER.clocks,
      bonusType: 'DELAY',
      bonusSeconds: 2,
    });
  });

  it.each<[string, SessionData]>([
    ['партия закончилась', session({status: 'FINISHED'})],
    [
      'часы остановлены',
      session({state: {...STATE, timer: {...TIMER, status: 'STOPPED'}}}),
    ],
    ['партия без таймера', session({state: {...STATE, timer: null}})],
  ])('нет часов: %s', (_, data) => {
    expect(activeTimer(data)).toBeNull();
  });

  it('пауза', () => {
    const paused = session({
      state: {
        ...STATE,
        timer: {...TIMER, status: 'PAUSED', pausedAt: '2026-10-21T10:00:10Z'},
      },
    });

    expect(activeTimer(paused)).toMatchObject({
      paused: true,
      pausedAt: '2026-10-21T10:00:10Z',
    });
  });
});

describe('stageClock', () => {
  const STAGE_TIMER = {
    kind: 'STAGE',
    status: 'RUNNING',
    deadline: '2026-10-21T10:00:30Z',
    pausedAt: null,
    clocks: [],
  } as const;

  it('общий отсчёт стадии идёт до её дедлайна, часов игроков нет', () => {
    const timer = activeTimer(
      session({state: {...STATE, stage: 'color-pick', timer: STAGE_TIMER}}),
    );

    expect(timer && stageClock(timer)).toEqual({
      remainingMs: Number.MAX_SAFE_INTEGER,
      delayMs: 0,
      deadline: STAGE_TIMER.deadline,
      paused: false,
      pausedAt: null,
    });
    expect(timer && playerClock(timer, ALICE, null)).toBeNull();
  });

  it('у часов игроков отсчёта стадии нет', () => {
    const timer = activeTimer(session());

    expect(timer && stageClock(timer)).toBeNull();
  });
});

describe('playerClock', () => {
  const timer = activeTimer(session());

  it('у ходящего часы идут до дедлайна', () => {
    expect(timer && playerClock(timer, ALICE, ALICE)).toEqual({
      remainingMs: 30_000,
      delayMs: 2000,
      deadline: TIMER.deadline,
      paused: false,
      pausedAt: null,
    });
  });

  it('у остальных — застывший запас', () => {
    expect(timer && playerClock(timer, BOB, ALICE)).toMatchObject({
      remainingMs: 25_000,
      delayMs: 2000,
      deadline: null,
    });
  });

  it('у не-игрока часов нет', () => {
    expect(timer && playerClock(timer, 'stranger', ALICE)).toBeNull();
  });

  it('при инкременте задержки в отсчёте нет', () => {
    const increment: ActiveTimer | null = timer && {
      ...timer,
      bonusType: 'INCREMENT',
    };
    expect(increment && playerClock(increment, ALICE, ALICE)).toMatchObject({
      remainingMs: 30_000,
      delayMs: 0,
    });
  });
});

describe('sessionFromSnapshot', () => {
  const snapshot = SessionSnapshotDto.parse({
    seq: 7,
    status: 'IN_PROGRESS',
    serverTime: '2026-10-21T10:00:00Z',
    meta: META,
    state: STATE,
  });

  it('смещение часов — время сервера минус время получения', () => {
    const receivedAt = Date.parse('2026-10-21T09:59:58Z');

    expect(sessionFromSnapshot(snapshot, receivedAt)).toMatchObject({
      seq: 7,
      clockOffsetMs: 2000,
    });
  });

  it('нечитаемое время сервера — без смещения', () => {
    expect(
      sessionFromSnapshot({...snapshot, serverTime: 'вчера'}, 0).clockOffsetMs,
    ).toBe(0);
  });
});
