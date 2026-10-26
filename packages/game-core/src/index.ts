// Ядро партии: конверт событий потока, общий применитель событий журнала
// (патчей документа), блоки core (игроки, очерёдность, часы, итог: guard и
// помощники) и проверка состояния: core + поля игры.
// Только чистые функции, без React и запросов.

export {
  activeTimer,
  isCoreState,
  moveOptionsOf,
  playerClock,
  type ActiveTimer,
  type CoreState,
  type MoveOption,
  type PlayerClock,
  type SessionPlayer,
  type SessionResult,
  type SessionTimer,
  type SessionTurns,
} from './core';
export {applySessionEvent, type ApplySessionEventResult} from './patch';
export {
  checkSeq,
  isSessionOver,
  sessionFromSnapshot,
  type SeqCheck,
  type SessionData,
  type SessionDocument,
  type SessionLogEvent,
  type SessionMeta,
  type SessionState,
  type SessionStatus,
  type SessionStreamEvent,
} from './session';
export {
  checkSessionState,
  parseSessionDocument,
  type GameStateRules,
} from './validate';
