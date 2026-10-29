import {
  RoomStreamEvent,
  type RoomStreamEventOutput,
} from '@qgames/api/portal/zod';
import {describe, expect, it} from 'vitest';

import {applyRoomStreamMessage, type RoomStreamData} from './roomStream';

const ROOM_ID = '0190a000-0000-7000-8000-0000000000a1';
const ALICE = '0190a000-0000-7000-8000-000000000001';
const BOB = '0190a000-0000-7000-8000-000000000002';
const SESSION = '0190a000-0000-7000-8000-0000000000b1';
const AT = '2026-10-29T10:00:00Z';

function member(id: string, role: 'PLAYER' | 'SPECTATOR' = 'PLAYER') {
  return {
    id,
    nickname: id === ALICE ? 'Alice' : 'Bob',
    avatar: 'CAT',
    role,
    leaving: false,
    joinedAt: AT,
  };
}

const ROOM = {
  id: ROOM_ID,
  gameCode: 'nothing',
  status: 'WAITING',
  ownerId: ALICE,
  minPlayers: 1,
  maxPlayers: 4,
  members: [member(ALICE)],
  session: null,
  createdAt: AT,
  settings: {
    room: {maxSpectators: 8},
    simple: {gameCode: 'nothing', rounds: 3, time: 'NONE'},
    advanced: {
      gameCode: 'nothing',
      rounds: 3,
      timeControl: {
        enabled: false,
        baseSeconds: 30,
        bonusType: 'INCREMENT',
        bonusSeconds: 0,
      },
    },
  },
};

/** Сообщение потока через схему контракта — как его отдаёт обёртка SSE. */
function message(type: string, data: unknown): RoomStreamEventOutput {
  return RoomStreamEvent.parse({type, data});
}

const snapshot = (seq: number) => message('snapshot', {seq, room: ROOM});

function patchEvent(
  seq: number,
  method: 'PUT' | 'PATCH' | 'DELETE' | 'INFO',
  code: string,
  data: unknown,
): RoomStreamEventOutput {
  return message(method.toLowerCase(), {seq, at: AT, method, code, data});
}

const joined = (seq: number) =>
  patchEvent(seq, 'PUT', 'member-joined', {
    path: ['members', {id: BOB}],
    value: member(BOB),
  });

/** Применяет сообщения по порядку, как поток; падает на не-applied. */
function fold(messages: RoomStreamEventOutput[]): RoomStreamData {
  let data: RoomStreamData | undefined;
  for (const item of messages) {
    const result = applyRoomStreamMessage(data, item, ALICE);
    if (result.type !== 'applied') {
      throw new Error(`сообщение не применилось: ${result.type}`);
    }
    data = result.data;
  }
  if (data === undefined) {
    throw new Error('нет сообщений');
  }
  return data;
}

describe('applyRoomStreamMessage', () => {
  it('снапшот заменяет комнату', () => {
    expect(fold([snapshot(4)])).toMatchObject({
      seq: 4,
      room: {id: ROOM_ID, ownerId: ALICE},
    });
  });

  it('события по порядку меняют комнату', () => {
    const data = fold([
      snapshot(4),
      joined(5),
      patchEvent(6, 'PATCH', 'role-changed', {
        path: ['members', {id: BOB}],
        value: {role: 'SPECTATOR'},
      }),
      patchEvent(7, 'PATCH', 'owner-changed', {
        path: [],
        value: {ownerId: BOB},
      }),
      patchEvent(8, 'PATCH', 'session-started', {
        path: [],
        value: {
          status: 'IN_GAME',
          session: {id: SESSION, status: 'IN_PROGRESS'},
        },
      }),
      patchEvent(9, 'DELETE', 'member-left', {path: ['members', {id: ALICE}]}),
    ]);

    expect(data.seq).toBe(9);
    expect(data.room).toMatchObject({
      status: 'IN_GAME',
      ownerId: BOB,
      session: {id: SESSION, status: 'IN_PROGRESS'},
      members: [{id: BOB, role: 'SPECTATOR'}],
    });
  });

  it('новые настройки заменяют прежние целиком', () => {
    const settings = {...ROOM.settings, room: {maxSpectators: 2}, simple: null};

    const data = fold([
      snapshot(1),
      patchEvent(2, 'PUT', 'settings-changed', {
        path: ['settings'],
        value: settings,
      }),
    ]);

    expect(data.room.settings).toEqual(settings);
  });

  it('повтор уже применённого события пропускается', () => {
    const data = fold([snapshot(4), joined(5)]);

    expect(applyRoomStreamMessage(data, joined(5), ALICE)).toEqual({
      type: 'skipped',
    });
  });

  it.each<[string, RoomStreamData | undefined, RoomStreamEventOutput]>([
    ['событие до снапшота', undefined, joined(1)],
    ['пропущено событие', fold([snapshot(4)]), joined(6)],
    [
      'путь не найден',
      fold([snapshot(4)]),
      patchEvent(5, 'PATCH', 'role-changed', {
        path: ['members', {id: BOB}],
        value: {role: 'SPECTATOR'},
      }),
    ],
    [
      'комната не по контракту',
      fold([snapshot(4)]),
      patchEvent(5, 'PATCH', 'owner-changed', {path: [], value: {ownerId: 7}}),
    ],
  ])('рассинхронизация: %s', (_, current, event) => {
    expect(applyRoomStreamMessage(current, event, ALICE).type).toBe('resync');
  });

  it('удаление комнаты заканчивает поток', () => {
    expect(
      applyRoomStreamMessage(
        fold([snapshot(4)]),
        patchEvent(5, 'INFO', 'room-deleted', {}),
        ALICE,
      ),
    ).toEqual({type: 'ended'});
  });

  it('исключение зрителя заканчивает поток', () => {
    const data = fold([snapshot(4), joined(5)]);

    expect(
      applyRoomStreamMessage(
        data,
        patchEvent(6, 'INFO', 'member-kicked', {userId: BOB}),
        BOB,
      ),
    ).toEqual({type: 'kicked'});
  });

  it('исключение другого участника применяется как обычное событие', () => {
    const data = fold([
      snapshot(4),
      joined(5),
      patchEvent(6, 'INFO', 'member-kicked', {userId: BOB}),
      patchEvent(7, 'DELETE', 'member-left', {path: ['members', {id: BOB}]}),
    ]);

    expect(data.seq).toBe(7);
    expect(data.room.members.map(m => m.id)).toEqual([ALICE]);
  });
});
