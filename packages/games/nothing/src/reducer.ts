import {
  composeReducers,
  reduceCore,
  reduceTimer,
  reduceTurns,
  type GameReducer,
  type SessionLogEvent,
} from '@qgames/game-core';

import {isNothingSession, type NothingState} from './state';

/** Событие игры `moved`: ход сделан (в том числе автоматически по таймауту). */
function reduceMoved(
  state: NothingState,
  event: SessionLogEvent,
): NothingState {
  if (event.type !== 'moved') {
    return state;
  }
  return {...state, moves: state.moves + 1};
}

const reduceNothingState = composeReducers<NothingState>(
  reduceCore,
  reduceTurns,
  reduceTimer,
  reduceMoved,
);

/**
 * Редьюсер «ничто»: модули core, turns, timer и событие `moved`. Партия другой
 * игры или неразборчивое состояние не меняются (доска покажет сообщение).
 */
export const reduceNothing: GameReducer = (session, event) => {
  const {state} = session;
  return isNothingSession(session)
    ? reduceNothingState(session.state, event)
    : state;
};
