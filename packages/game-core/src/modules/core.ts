import {
  SessionPlayerDto,
  type MoveOptionDtoOutput,
  type SessionPlayerDtoOutput,
} from '@qgames/api/portal/zod';

import type {SessionState} from '../session';
import type {SessionModule} from './module';

/** Вариант хода — тот же конверт `{type, data?}`, что тело хода. */
export type MoveOption = MoveOptionDtoOutput;

/** Игрок партии (модуль core): id и допустимые сейчас ходы. */
export type SessionPlayer = SessionPlayerDtoOutput;

/** Блок модуля core в состоянии игры. */
export interface CoreBlock {
  players: readonly SessionPlayer[];
}

const PlayersSchema = SessionPlayerDto.array();

/** Блок core (`players`) по схеме контракта. */
export function isCoreBlock(
  state: SessionState,
): state is SessionState & CoreBlock {
  return PlayersSchema.safeParse(state['players']).success;
}

/** Модуль core: игроки и их допустимые ходы. Есть у каждой игры. */
export const coreModule: SessionModule = {name: 'core', isBlock: isCoreBlock};

/** Допустимые ходы игрока; у чужого игрока (маска) и у не-игрока — пусто. */
export function moveOptionsOf(
  state: CoreBlock,
  playerId: string,
): readonly MoveOption[] {
  return state.players.find(p => p.id === playerId)?.moveOptions ?? [];
}
