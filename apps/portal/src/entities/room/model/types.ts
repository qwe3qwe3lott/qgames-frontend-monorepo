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

function toMemberView(member: RoomMemberResponse): RoomMemberView | null {
  if (member.userId === undefined || member.role === undefined) {
    return null;
  }
  return {
    userId: member.userId,
    nickname: member.nickname ?? null,
    avatar: member.avatar ?? null,
    role: member.role,
    owner: member.owner ?? false,
  };
}

function toSessionView(session: SessionResponse): SessionView | null {
  const {id, status, players, version, state} = session;
  if (id === undefined || status === undefined || version === undefined) {
    return null;
  }
  return {id, status, players: players ?? [], version, state};
}

/**
 * Приводит ответ к обязательным полям. В контракте все поля ответа optional
 * (недочёт спецификации, CLAUDE.md §5); без ключевых полей комнату не показываем.
 */
export function toRoomView(room: RoomResponse): RoomView | null {
  const {id, gameType, status, minPlayers, maxPlayers} = room;
  if (
    id === undefined ||
    gameType === undefined ||
    status === undefined ||
    minPlayers === undefined ||
    maxPlayers === undefined
  ) {
    return null;
  }
  return {
    id,
    gameType,
    status,
    ownerId: room.ownerId ?? null,
    minPlayers,
    maxPlayers,
    members: (room.members ?? []).flatMap(member => {
      const view = toMemberView(member);
      return view === null ? [] : [view];
    }),
    session:
      room.session === undefined || room.session === null
        ? null
        : toSessionView(room.session),
  };
}
