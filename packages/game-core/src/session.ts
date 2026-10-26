import type {
  SessionMetaDtoOutput,
  SessionPatchEventOutput,
  SessionSnapshotDtoOutput,
  SessionStreamEventOutput,
} from '@qgames/api/portal/zod';

/** Сообщение потока партии `{type, data}` после проверки Zod-схемой контракта. */
export type SessionStreamEvent = SessionStreamEventOutput;

/**
 * Событие журнала партии `{seq, at, method, code, data}`: одна операция над
 * документом партии. Состояние меняется только по `method`, `code` — что
 * произошло (для журнала и логов).
 */
export type SessionLogEvent = SessionPatchEventOutput;

export type SessionStatus = SessionSnapshotDtoOutput['status'];

/**
 * Описание партии, закреплённое при старте: код игры и правила. `moveRules` —
 * правила хода конкретной игры (у игры без них — null): общая проверка
 * документа их не разбирает, форму проверяет guard игры по `meta.game.code`.
 */
export type SessionMeta = Omit<SessionMetaDtoOutput, 'moveRules'> & {
  moveRules?: unknown;
};

/**
 * Состояние партии любой игры: объект из блоков core (`players`, `turns`,
 * `timer`, `result`) и полей игры. Блоки проверяет `isCoreState`
 * (`checkSessionState`), поля игры — guard пакета игры; конкретный тип сужает
 * guard игры по `meta.game.code` (например, `isNothingSession`).
 */
export type SessionState = Readonly<Record<string, unknown>>;

/**
 * Документ партии — корень путей событий журнала: снапшот без служебных полей
 * (`seq`, `serverTime`).
 */
export interface SessionDocument {
  status: SessionStatus;
  meta: SessionMeta;
  state: SessionState;
}

/** Партия для зрителя: снапшот, к которому применены события журнала. */
export interface SessionData extends SessionDocument {
  /** seq последнего применённого события. */
  seq: number;
  /** Смещение часов: время сервера минус `Date.now()` клиента, мс. */
  clockOffsetMs: number;
}

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
 * Партия закончилась (или отменена): дальше событий не будет. Конец партии —
 * тоже патч документа (`PATCH [] {status}`), поэтому решает только статус.
 */
export function isSessionOver(session: SessionDocument): boolean {
  return session.status !== 'IN_PROGRESS';
}
