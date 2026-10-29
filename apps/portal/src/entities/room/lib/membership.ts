import type {RoomMemberView, RoomView} from '../model/types';

export interface Membership {
  /** Участник комнаты; null — пользователь ещё не вошёл. */
  member: RoomMemberView | null;
  isOwner: boolean;
  isPlayer: boolean;
  inGame: boolean;
  playersCount: number;
  hasFreeSeat: boolean;
  /** Наблюдателей сейчас; после понижения лимита их может быть больше него. */
  spectatorsCount: number;
  /** Лимит наблюдателей комнаты. */
  maxSpectators: number;
  hasSpectatorSeat: boolean;
  /**
   * Новичку найдётся место: игрока (партия не идёт и есть место) или
   * наблюдателя. Как решает сервер при входе в комнату.
   */
  canJoin: boolean;
  /** Хватает ли игроков, чтобы владелец начал партию. */
  enoughPlayers: boolean;
}

/** Что пользователь может делать в комнате. */
export function membership(room: RoomView, userId: string): Membership {
  const member = room.members.find(m => m.id === userId) ?? null;
  const playersCount = room.members.filter(m => m.role === 'PLAYER').length;
  const spectatorsCount = room.members.filter(
    m => m.role === 'SPECTATOR',
  ).length;
  const {maxSpectators} = room.settings.room;
  const inGame = room.status === 'IN_GAME';
  const hasFreeSeat = playersCount < room.maxPlayers;
  const hasSpectatorSeat = spectatorsCount < maxSpectators;
  return {
    member,
    isOwner: member !== null && room.ownerId === userId,
    isPlayer: member?.role === 'PLAYER',
    inGame,
    playersCount,
    hasFreeSeat,
    spectatorsCount,
    maxSpectators,
    hasSpectatorSeat,
    canJoin: (!inGame && hasFreeSeat) || hasSpectatorSeat,
    enoughPlayers:
      playersCount >= room.minPlayers && playersCount <= room.maxPlayers,
  };
}

export const UNKNOWN_NICKNAME = 'Игрок';

export function memberName(member: RoomMemberView): string {
  return member.nickname ?? UNKNOWN_NICKNAME;
}
