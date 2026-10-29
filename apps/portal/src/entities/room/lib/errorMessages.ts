import {errorMessage, isApiError} from '@qgames/api';

const ROOM_MESSAGES: Readonly<Record<string, string>> = {
  ROOM_NOT_FOUND: 'Комнаты нет или она удалена.',
  GAME_NOT_FOUND: 'Игра недоступна.',
  GAME_TYPE_MISMATCH: 'Комната относится к другой игре.',
  NOT_ROOM_MEMBER: 'Сначала войдите в комнату.',
  NOT_ROOM_OWNER: 'Это может сделать только владелец комнаты.',
  NEW_OWNER_NOT_PRESENT: 'Участник уже вышел из комнаты.',
  NOT_SESSION_PLAYER: 'Вы не участвуете в этой партии.',
  ROOM_NOT_WAITING: 'Идёт партия — дождитесь её окончания.',
  ROOM_NOT_IN_GAME: 'Партия не идёт.',
  NO_FREE_SEAT: 'Свободных мест игрока нет.',
  NO_SPECTATOR_SEAT: 'Свободных мест наблюдателя нет.',
  NOT_ENOUGH_PLAYERS: 'Число игроков не подходит игре.',
  SESSION_NOT_FOUND: 'Партия не найдена.',
  SESSION_PAUSED: 'Партия на паузе — ходить нельзя.',
  SESSION_NOT_PAUSABLE: 'В партии без таймера паузы нет.',
};

const MOVE_REASONS: Readonly<Record<string, string>> = {
  NOT_YOUR_TURN: 'Сейчас ход другого игрока.',
  GAME_FINISHED: 'Партия уже закончилась.',
  UNKNOWN_MOVE: 'Такого хода в игре нет.',
};

/** Текст ошибки действия с комнатой или партией. */
export function roomErrorMessage(error: unknown): string {
  if (isApiError(error) && error.code === 'MOVE_REJECTED') {
    return (
      (error.reason === undefined ? undefined : MOVE_REASONS[error.reason]) ??
      'Ход не принят по правилам игры.'
    );
  }
  return errorMessage(error, ROOM_MESSAGES);
}
