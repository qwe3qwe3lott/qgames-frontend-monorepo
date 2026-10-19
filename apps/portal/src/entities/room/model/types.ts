import type {
  RoomMemberResponse,
  RoomResponse,
  RoomResponseGameType,
  SessionResponse,
} from '@qgames/api/gateway/model';

export type RoomStatus = 'WAITING' | 'IN_GAME';
export type RoomRole = 'PLAYER' | 'SPECTATOR';
export type SessionStatus = 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';

export interface RoomMemberView {
  userId: string;
  /** null в первые секунды после регистрации, пока профиль не дошёл до игрового сервиса. */
  nickname: string | null;
  avatar: 'CAT' | 'DOG' | null;
  role: RoomRole;
  owner: boolean;
}

export interface SessionView {
  id: string;
  status: SessionStatus;
  players: readonly string[];
  version: number;
  state: unknown;
}

export interface RoomView {
  id: string;
  gameType: RoomResponseGameType;
  status: RoomStatus;
  ownerId: string | null;
  minPlayers: number;
  maxPlayers: number;
  members: readonly RoomMemberView[];
  /** Текущая партия, а если её нет — последняя завершённая или отменённая. */
  session: SessionView | null;
}

function toMemberView(member: RoomMemberResponse): RoomMemberView {
  return {
    userId: member.userId,
    nickname: member.nickname ?? null,
    avatar: member.avatar ?? null,
    role: member.role,
    owner: member.owner,
  };
}

function toSessionView(session: SessionResponse): SessionView {
  const {id, status, players, version, state} = session;
  return {id, status, players, version, state};
}

/** Ответ комнаты в виде для UI: необязательные nullable-поля приведены к `null`. */
export function toRoomView(room: RoomResponse): RoomView {
  return {
    id: room.id,
    gameType: room.gameType,
    status: room.status,
    ownerId: room.ownerId ?? null,
    minPlayers: room.minPlayers,
    maxPlayers: room.maxPlayers,
    members: room.members.map(toMemberView),
    session:
      room.session === undefined || room.session === null
        ? null
        : toSessionView(room.session),
  };
}
