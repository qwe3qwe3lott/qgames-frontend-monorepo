import type {
  SessionMetaDtoOutput,
  SessionSnapshotDtoOutput,
  SessionStateDtoOutput,
  SessionStreamEventOutput,
} from '@qgames/api/gateway/zod';

/** Сообщение потока партии `{type, data}` после проверки Zod-схемой контракта. */
export type SessionStreamEvent = SessionStreamEventOutput;

/** Событие журнала партии (всё, кроме снапшота): `data` — кадр `{seq, at, data}`. */
export type SessionLogEvent = Exclude<SessionStreamEvent, {type: 'snapshot'}>;

export type SessionStatus = SessionSnapshotDtoOutput['status'];

/** Описание партии, закреплённое при старте: код игры и правила. */
export type SessionMeta = SessionMetaDtoOutput;

/**
 * Состояние партии любой игры (union схем игр без дискриминатора). Игра
 * определяется по `meta.game.code`, тип сужает guard пакета игры.
 */
export type SessionState = SessionStateDtoOutput;

/** Партия для зрителя: снапшот, к которому применены события журнала. */
export interface SessionData {
  /** seq последнего применённого события. */
  seq: number;
  status: SessionStatus;
  meta: SessionMeta;
  state: SessionState;
  /** Смещение часов: время сервера минус `Date.now()` клиента, мс. */
  clockOffsetMs: number;
}

/**
 * Редьюсер состояния игры: применяет событие журнала к состоянию. Игра
 * выбирает себя по `session.meta.game.code` и возвращает новое состояние;
 * событие не по её части возвращает состояние как есть.
 */
export type GameReducer = (
  session: SessionData,
  event: SessionLogEvent,
) => SessionState;

/**
 * Партия из снапшота. `receivedAt` — момент получения снапшота (`Date.now()`):
 * по нему и `serverTime` считается смещение часов для обратного отсчёта.
 */
export function sessionFromSnapshot(
  snapshot: SessionSnapshotDtoOutput,
  receivedAt: number,
): SessionData {
  const serverTime = Date.parse(snapshot.serverTime);
  return {
    seq: snapshot.seq,
    status: snapshot.status,
    meta: snapshot.meta,
    state: snapshot.state,
    clockOffsetMs: Number.isNaN(serverTime) ? 0 : serverTime - receivedAt,
  };
}

/**
 * Сверка seq события с последним применённым: `next` — применить, `duplicate`
 * — уже применено (отбросить), `gap` — событие потеряно (переподключиться за
 * свежим снапшотом).
 */
export type SeqCheck = 'next' | 'duplicate' | 'gap';

export function checkSeq(lastSeq: number, seq: number): SeqCheck {
  if (seq <= lastSeq) {
    return 'duplicate';
  }
  return seq === lastSeq + 1 ? 'next' : 'gap';
}

/**
 * Слой сессии: применяет событие журнала (seq уже сверен `checkSeq`).
 * Конец и отмена партии меняют статус, `started` задаёт описание и начальное
 * состояние, остальное — события модулей и игры (`reduceGame`).
 */
export function reduceSession(
  session: SessionData,
  event: SessionLogEvent,
  reduceGame: GameReducer,
): SessionData {
  const seq = event.data.seq;
  switch (event.type) {
    case 'session-finished':
      return {...session, seq, status: 'FINISHED'};
    case 'session-cancelled':
      return {...session, seq, status: 'CANCELLED'};
    case 'started':
      return {
        ...session,
        seq,
        meta: event.data.data.meta,
        state: event.data.data.state,
      };
    default:
      return {...session, seq, state: reduceGame(session, event)};
  }
}

/** Партия закончилась (или отменена): дальше событий не будет. */
export function isSessionOver(session: SessionData): boolean {
  return session.status !== 'IN_PROGRESS';
}
