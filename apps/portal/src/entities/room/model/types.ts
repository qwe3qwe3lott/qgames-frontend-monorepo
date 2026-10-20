import type {
  RoomMemberResponse,
  RoomResponse,
  RoomResponseGameCode,
  RoomSettingsDto,
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
  /** Вышел, но льготный срок ещё не истёк: остаётся в списках и на месте. */
  leaving: boolean;
}

export interface SessionView {
  id: string;
  status: SessionStatus;
  players: readonly string[];
  version: number;
  state: unknown;
  /** Дедлайн текущего хода (ISO 8601); null — без таймера или партия не идёт. */
  moveDeadline: string | null;
  /** Момент постановки на паузу (ISO 8601); null — партия не на паузе. */
  pausedAt: string | null;
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
  /** Смещение часов: время сервера минус `Date.now()` клиента, мс. */
  clockOffsetMs: number;
}

function toMemberView(member: RoomMemberResponse): RoomMemberView {
  return {
    userId: member.userId,
    nickname: member.nickname ?? null,
    avatar: member.avatar ?? null,
    role: member.role,
    owner: member.owner,
    leaving: member.leaving,
  };
}

function toSessionView(session: SessionResponse): SessionView {
  const {id, status, players, version, state} = session;
  return {
    id,
    status,
    players,
    version,
    state,
    moveDeadline: session.moveDeadline ?? null,
    pausedAt: session.pausedAt ?? null,
  };
}

/**
 * Ответ комнаты в виде для UI: необязательные nullable-поля приведены к `null`.
 * `receivedAt` — момент получения ответа (`dataUpdatedAt` запроса): по нему и
 * `serverTime` считается смещение часов для обратного отсчёта.
 */
export function toRoomView(room: RoomResponse, receivedAt: number): RoomView {
  const serverTime = Date.parse(room.serverTime);
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
    clockOffsetMs: Number.isNaN(serverTime) ? 0 : serverTime - receivedAt,
  };
}
