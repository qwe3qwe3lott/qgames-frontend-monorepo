import type {RoomMemberView, RoomView} from '../model/types';

export interface Membership {
  /** Участник комнаты; null — пользователь ещё не вошёл. */
  member: RoomMemberView | null;
  isOwner: boolean;
  isPlayer: boolean;
  inGame: boolean;
  playersCount: number;
  hasFreeSeat: boolean;
  /** Хватает ли игроков, чтобы владелец начал партию. */
  enoughPlayers: boolean;
}

/** Что пользователь может делать в комнате. */
export function membership(room: RoomView, userId: string): Membership {
  const member = room.members.find(m => m.userId === userId) ?? null;
  const playersCount = room.members.filter(m => m.role === 'PLAYER').length;
  return {
    member,
    isOwner: member?.owner ?? false,
    isPlayer: member?.role === 'PLAYER',
    inGame: room.status === 'IN_GAME',
    playersCount,
    hasFreeSeat: playersCount < room.maxPlayers,
    enoughPlayers:
      playersCount >= room.minPlayers && playersCount <= room.maxPlayers,
  };
}

export const UNKNOWN_NICKNAME = 'Игрок';

export function memberName(member: RoomMemberView): string {
  return member.nickname ?? UNKNOWN_NICKNAME;
}
