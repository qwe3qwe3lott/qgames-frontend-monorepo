// Ядро партии: конверт событий потока, слой сессии и модули-механики.
// Только чистые функции, без React и запросов.

export {composeReducers, type StateReducer} from './compose';
export {
  moveOptionsOf,
  reduceCore,
  type CoreBlock,
  type MoveOption,
  type SessionPlayer,
} from './modules/core';
export {
  activeTimer,
  reduceTimer,
  type ActiveTimer,
  type SessionTimer,
  type TimerBlock,
} from './modules/timer';
export {
  currentPlayerId,
  reduceTurns,
  type SessionTurns,
  type TurnsBlock,
} from './modules/turns';
export {
  checkSeq,
  isSessionOver,
  reduceSession,
  sessionFromSnapshot,
  type GameReducer,
  type SeqCheck,
  type SessionData,
  type SessionLogEvent,
  type SessionMeta,
  type SessionState,
  type SessionStatus,
  type SessionStreamEvent,
} from './session';
