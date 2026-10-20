import type {
  RoomMemberResponse,
  RoomResponse,
  RoomSettingsDto,
  SessionResponse,
} from '@qgames/api/gateway/model';
import type {
  RoomMemberResponseOutput,
  RoomResponseOutput,
  RoomSettingsDtoOutput,
  SessionResponseOutput,
} from '@qgames/api/gateway/zod';

// Данные событий потока проходят сгенерированные Zod-схемы, а кеш комнаты
// хранит типы модели Orval. У nullable-полей Zod (`.nullish()`) даёт
// `T | null | undefined`, а модель — `T | null`, и при
// exactOptionalPropertyTypes они несовместимы. Поэтому отсутствующее значение
// приводится к null — для UI это одно и то же (`toRoomView`).

export function memberFromStream(
  member: RoomMemberResponseOutput,
): RoomMemberResponse {
  return {
    ...member,
    avatar: member.avatar ?? null,
    nickname: member.nickname ?? null,
  };
}

export function settingsFromStream(
  settings: RoomSettingsDtoOutput,
): RoomSettingsDto {
  return {
    ...settings,
    timeControl: {
      ...settings.timeControl,
      moveSeconds: settings.timeControl.moveSeconds ?? null,
    },
  };
}

function sessionFromStream(session: SessionResponseOutput): SessionResponse {
  return {
    ...session,
    moveDeadline: session.moveDeadline ?? null,
    pausedAt: session.pausedAt ?? null,
  };
}

export function roomFromStream(room: RoomResponseOutput): RoomResponse {
  return {
    ...room,
    ownerId: room.ownerId ?? null,
    members: room.members.map(memberFromStream),
    settings: settingsFromStream(room.settings),
    session:
      room.session === undefined || room.session === null
        ? null
        : sessionFromStream(room.session),
  };
}
