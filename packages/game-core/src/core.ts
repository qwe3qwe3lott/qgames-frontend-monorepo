import {
  SessionPlayerDto,
  SessionResultDto,
  SessionTimerDto,
  SessionTurnsDto,
  type MoveOptionDtoOutput,
  type SessionPlayerDtoOutput,
  type SessionResultDtoOutput,
  type SessionTimerDtoOutput,
  type SessionTurnsDtoOutput,
} from '@qgames/api/portal/zod';

import type {SessionData, SessionState} from './session';

/** Вариант хода — тот же конверт `{type, data?}`, что тело хода. */
export type MoveOption = MoveOptionDtoOutput;

/** Игрок партии: id и допустимые сейчас ходы (поля игры у игрока проверяет игра). */
export type SessionPlayer = SessionPlayerDtoOutput;

/** Очерёдность: чей ход, раунд, число раундов. */
export type SessionTurns = SessionTurnsDtoOutput;

/** Шахматные часы партии; пауза — их состояние. */
export type SessionTimer = SessionTimerDtoOutput;

/** Итог партии: победа или ничья, победители, причина игры. */
export type SessionResult = SessionResultDtoOutput;

/**
 * Блоки core в состоянии любой игры (как на бэкенде): игроки, очерёдность,
 * часы (null — партия без таймера) и итог (null — итога нет: партия идёт или
 * отменена). Игра — надстройка над core: механику, которая ей не нужна, она
 * просто не использует.
 */
export interface CoreState {
  players: readonly SessionPlayer[];
  turns: SessionTurns;
  timer?: SessionTimer | null | undefined;
  result?: SessionResult | null | undefined;
}

const PlayersSchema = SessionPlayerDto.array();
const TimerSchema = SessionTimerDto.nullish();
const ResultSchema = SessionResultDto.nullish();

/**
 * Блоки core по сгенерированным схемам контракта; поля игры (в том числе
 * поля игры в объектах игроков) не проверяет.
 */
export function isCoreState(
  state: SessionState,
): state is SessionState & CoreState {
  return (
    PlayersSchema.safeParse(state['players']).success &&
    SessionTurnsDto.safeParse(state['turns']).success &&
    TimerSchema.safeParse(state['timer']).success &&
    ResultSchema.safeParse(state['result']).success
  );
}

/** Допустимые ходы игрока; у чужого игрока (маска) и у не-игрока — пусто. */
export function moveOptionsOf(
  state: CoreState,
  playerId: string,
): readonly MoveOption[] {
  return state.players.find(p => p.id === playerId)?.moveOptions ?? [];
}

/** Часы идущей партии в виде для UI. */
export interface ActiveTimer {
  paused: boolean;
  /** Когда кончится запас ходящего (ISO 8601, часы сервера); null — ход ничей. */
  deadline: string | null;
  /** С какого момента пауза (ISO 8601, часы сервера); null — таймер идёт. */
  pausedAt: string | null;
  /** Запас каждого игрока на момент последней смены хода, мс. */
  clocks: readonly {playerId: string; remainingMs: number}[];
  /** Добавка за ход в секундах; 0 — без добавки. */
  incrementSeconds: number;
}

/** Часы одного игрока для показа. */
export interface PlayerClock {
  /** Сохранённый запас, мс; у ходящего — на начало его хода. */
  remainingMs: number;
  /** Дедлайн, если часы идут у этого игрока (он ходит); иначе null. */
  deadline: string | null;
  paused: boolean;
  pausedAt: string | null;
}

/**
 * Часы, которые нужно показывать, — единственное место, где решается,
 * действуют ли они. null — партия без таймера (или блок не по схеме), часы
 * остановлены (STOPPED приходит перед концом и отменой партии) или партия уже
 * не идёт (на случай снапшота без остановленных часов).
 */
export function activeTimer(session: SessionData): ActiveTimer | null {
  if (session.status !== 'IN_PROGRESS') {
    return null;
  }
  const {state} = session;
  const timer = isCoreState(state) ? state.timer : null;
  if (timer === undefined || timer === null || timer.status === 'STOPPED') {
    return null;
  }
  return {
    paused: timer.status === 'PAUSED',
    deadline: timer.deadline ?? null,
    pausedAt: timer.pausedAt ?? null,
    clocks: timer.clocks,
    incrementSeconds: session.meta.game.settings.timeControl.incrementSeconds,
  };
}

/**
 * Часы игрока [playerId]: идут только у ходящего ([currentPlayerId]),
 * у остальных — застывший запас. null — у игрока нет часов.
 */
export function playerClock(
  timer: ActiveTimer,
  playerId: string,
  currentPlayerId: string | null,
): PlayerClock | null {
  const clock = timer.clocks.find(item => item.playerId === playerId);
  if (clock === undefined) {
    return null;
  }
  return {
    remainingMs: clock.remainingMs,
    deadline: playerId === currentPlayerId ? timer.deadline : null,
    paused: timer.paused,
    pausedAt: timer.pausedAt,
  };
}
