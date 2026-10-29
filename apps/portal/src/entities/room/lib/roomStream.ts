import type {RoomResponse} from '@qgames/api/portal/model';
import {
  RoomResponse as RoomResponseSchema,
  type RoomStreamEventOutput,
} from '@qgames/api/portal/zod';
import {applyPatch, checkSeq} from '@qgames/doc-patch';

import {roomFromStream} from './streamData';

/** Комната из потока: документ потока и seq последнего применённого события. */
export interface RoomStreamData {
  seq: number;
  room: RoomResponse;
}

/** Последнее событие потока: комната удалена, дальше событий не будет. */
const ROOM_DELETED = 'room-deleted';

/**
 * Владелец исключил участника `data.userId`; следом идёт member-left или
 * member-leaving. У исключённого это последнее событие потока.
 */
const MEMBER_KICKED = 'member-kicked';

/**
 * Итог применения сообщения: `applied` — новая комната, `skipped` — повтор
 * (seq уже применён), `resync` — событие потеряно, не применилось или дало
 * документ не по контракту (рассинхронизация, нужен свежий снапшот), `ended` —
 * комната удалена, поток больше не нужен, `kicked` — зрителя исключили из
 * комнаты, поток закрыт сервером.
 */
export type RoomStreamResult =
  | {type: 'applied'; data: RoomStreamData}
  | {type: 'skipped'}
  | {type: 'resync'; reason: string}
  | {type: 'ended'}
  | {type: 'kicked'};

/**
 * Применяет сообщение потока комнаты к комнате из потока — чистая функция:
 * снапшот заменяет комнату, событие применяется общим `applyPatch` (по
 * `method`, как партия) строго по порядку seq. Документ после события
 * проверяется схемой `RoomResponse` контракта.
 *
 * @param current комната из потока; undefined — снапшота ещё не было.
 * @param viewerId зритель потока: его исключение заканчивает поток.
 */
export function applyRoomStreamMessage(
  current: RoomStreamData | undefined,
  message: RoomStreamEventOutput,
  viewerId: string,
): RoomStreamResult {
  if (message.type === 'snapshot') {
    const {seq, room} = message.data;
    return {type: 'applied', data: {seq, room: roomFromStream(room)}};
  }
  const event = message.data;
  if (event.code === ROOM_DELETED) {
    return {type: 'ended'};
  }
  if (
    event.code === MEMBER_KICKED &&
    event.method === 'INFO' &&
    event.data['userId'] === viewerId
  ) {
    return {type: 'kicked'};
  }
  if (current === undefined) {
    return {type: 'resync', reason: `#${String(event.seq)} до снапшота`};
  }
  switch (checkSeq(current.seq, event.seq)) {
    case 'duplicate':
      return {type: 'skipped'};
    case 'gap':
      return {
        type: 'resync',
        reason: `ждали #${String(current.seq + 1)}, пришло #${String(event.seq)}`,
      };
    case 'next':
      break;
  }
  const patched = applyPatch(current.room, event);
  if (!patched.ok) {
    return {type: 'resync', reason: patched.error};
  }
  const room = RoomResponseSchema.safeParse(patched.document);
  if (!room.success) {
    return {
      type: 'resync',
      reason: `${event.method} ${event.code}: комната не по контракту`,
    };
  }
  return {
    type: 'applied',
    data: {seq: event.seq, room: roomFromStream(room.data)},
  };
}
