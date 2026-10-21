import type {
  MoveOptionDtoOutput,
  SessionPlayerDtoOutput,
} from '@qgames/api/gateway/zod';

import type {SessionLogEvent} from '../session';

/** Вариант хода — тот же конверт `{type, data?}`, что тело хода. */
export type MoveOption = MoveOptionDtoOutput;

/** Игрок партии (модуль core): id и допустимые сейчас ходы. */
export type SessionPlayer = SessionPlayerDtoOutput;

/** Блок модуля core в состоянии игры. */
export interface CoreBlock {
  players: readonly SessionPlayer[];
}

/**
 * Модуль core: `player-changed` несёт игрока целиком и заменяет его по id
 * (PUT). Новый id дописывается в конец.
 */
export function reduceCore<S extends CoreBlock>(
  state: S,
  event: SessionLogEvent,
): S {
  if (event.type !== 'player-changed') {
    return state;
  }
  const player = event.data.data;
  const known = state.players.some(p => p.id === player.id);
  const players = known
    ? state.players.map(p => (p.id === player.id ? player : p))
    : [...state.players, player];
  return {...state, players};
}

/** Допустимые ходы игрока; у чужого игрока (маска) и у не-игрока — пусто. */
export function moveOptionsOf(
  state: CoreBlock,
  playerId: string,
): readonly MoveOption[] {
  return state.players.find(p => p.id === playerId)?.moveOptions ?? [];
}
