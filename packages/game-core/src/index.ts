// Ядро партии: конверт событий потока, общий применитель событий журнала
// (патчей документа), модули-механики (guard'ы блоков состояния и помощники)
// и проверка состояния по модулям игры.
// Только чистые функции, без React и запросов.

export {
  coreModule,
  isCoreBlock,
  moveOptionsOf,
  type CoreBlock,
  type MoveOption,
  type SessionPlayer,
} from './modules/core';
export type {SessionModule, SessionModuleName} from './modules/module';
export {
  isResultBlock,
  resultModule,
  sessionResult,
  type ResultBlock,
  type SessionResult,
} from './modules/result';
export {
  activeTimer,
  isTimerBlock,
  playerClock,
  timerModule,
  type ActiveTimer,
  type PlayerClock,
  type SessionTimer,
  type TimerBlock,
} from './modules/timer';
export {
  currentPlayerId,
  isTurnsBlock,
  turnsModule,
  type SessionTurns,
  type TurnsBlock,
} from './modules/turns';
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
