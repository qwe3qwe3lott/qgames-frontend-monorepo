import type {RoomStatus} from '../model/types';

export const ROOM_STATUS_LABELS: Readonly<Record<RoomStatus, string>> = {
  WAITING: 'Ожидание игроков',
  IN_GAME: 'Идёт партия',
};
