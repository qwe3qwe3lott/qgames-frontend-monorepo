import type {SessionData} from '@qgames/game-core';
import {queryOptions, skipToken} from '@tanstack/react-query';

/**
 * Партия из потока лежит в кеше Query под ключом `['session-stream', sessionId]`.
 * Исключение из правила «ключи только из Orval» (CLAUDE.md §4): у потока партии
 * нет GET-ручки, данные пишет только `useSessionEvents`, запроса нет
 * (`skipToken`).
 */
export function sessionStreamQueryOptions(sessionId: string | null) {
  return queryOptions<SessionData>({
    queryKey: ['session-stream', sessionId],
    queryFn: skipToken,
    staleTime: Infinity,
  });
}
