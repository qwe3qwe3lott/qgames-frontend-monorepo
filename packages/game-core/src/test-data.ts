// Данные для unit-тестов game-core: документ партии «игры в ничто» по контракту.

export const ALICE = '0190a000-0000-7000-8000-000000000001';
export const BOB = '0190a000-0000-7000-8000-000000000002';

export const TIMER = {
  status: 'RUNNING',
  deadline: '2026-10-21T10:00:30Z',
  pausedAt: null,
  clocks: [
    {playerId: ALICE, remainingMs: 30_000},
    {playerId: BOB, remainingMs: 25_000},
  ],
} as const;

export const STATE = {
  players: [
    {id: ALICE, moveOptions: [{type: 'PASS'}]},
    {id: BOB, moveOptions: []},
  ],
  turns: {currentPlayerId: ALICE, round: 1, rounds: 3},
  timer: TIMER,
  result: null,
  moves: 0,
};

export const META = {
  game: {
    code: 'nothing',
    settings: {
      gameCode: 'nothing',
      rounds: 3,
      timeControl: {enabled: true, baseSeconds: 30, incrementSeconds: 2},
    },
  },
} as const;

export const DOCUMENT = {status: 'IN_PROGRESS', meta: META, state: STATE};
