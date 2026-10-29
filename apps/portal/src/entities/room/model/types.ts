import type {
  RoomMemberResponse,
  RoomResponse,
  RoomResponseGameCode,
  RoomSettingsDto,
  SessionResponse,
} from '@qgames/api/portal/model';

export type RoomStatus = 'WAITING' | 'IN_GAME';
export type RoomRole = 'PLAYER' | 'SPECTATOR';
export type SessionStatus = 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';

export interface RoomMemberView {
  /** Id пользователя. */
  id: string;
  /** null в первые секунды после регистрации, пока профиль не дошёл до игрового сервиса. */
  nickname: string | null;
  avatar: 'CAT' | 'DOG' | null;
  role: RoomRole;
  /** Игрок идущей партии не подключён: остаётся на своём месте до конца партии. */
  leaving: boolean;
}

/** Партия в ответе комнаты: только id и статус, состояние — в потоке партии. */
export interface SessionView {
  id: string;
  status: SessionStatus;
}

export interface RoomView {
  id: string;
  gameCode: RoomResponseGameCode;
  status: RoomStatus;
  ownerId: string | null;
  minPlayers: number;
  maxPlayers: number;
  members: readonly RoomMemberView[];
  /** Текущая партия, а если её нет — последняя завершённая или отменённая. */
  session: SessionView | null;
  /** Текущие настройки комнаты; следующая партия стартует с ними. */
  settings: RoomSettingsDto;
}

function toMemberView(member: RoomMemberResponse): RoomMemberView {
  return {
    id: member.id,
    nickname: member.nickname ?? null,
    avatar: member.avatar ?? null,
    role: member.role,
    leaving: member.leaving,
  };
}

function toSessionView({id, status}: SessionResponse): SessionView {
  return {id, status};
}

/** Ответ комнаты в виде для UI: необязательные nullable-поля приведены к `null`. */
export function toRoomView(room: RoomResponse): RoomView {
  return {
    id: room.id,
    gameCode: room.gameCode,
    status: room.status,
    ownerId: room.ownerId ?? null,
    minPlayers: room.minPlayers,
    maxPlayers: room.maxPlayers,
    members: room.members.map(toMemberView),
    session:
      room.session === undefined || room.session === null
        ? null
        : toSessionView(room.session),
    settings: room.settings,
  };
}
