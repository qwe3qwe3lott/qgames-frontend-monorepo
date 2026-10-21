import type {SessionLogEvent} from './session';

/** Редьюсер блока состояния (модуль или игра): чистая функция без побочных эффектов. */
export type StateReducer<S> = (state: S, event: SessionLogEvent) => S;

/**
 * Последовательно применяет редьюсеры модулей и игры. Каждый редьюсер
 * обрабатывает свои события, остальные возвращает без изменений.
 */
export function composeReducers<S>(
  ...reducers: readonly StateReducer<S>[]
): StateReducer<S> {
  return (state, event) =>
    reducers.reduce((current, reducer) => reducer(current, event), state);
}
