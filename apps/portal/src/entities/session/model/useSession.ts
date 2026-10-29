import type {SessionData} from '@qgames/game-core';
import {useQuery} from '@tanstack/react-query';

import {sessionStreamQueryOptions} from './query';

/**
 * Партия из кеша потока (`useSessionEvents`); undefined — снапшот ещё не
 * пришёл или партии нет.
 */
export function useSession(sessionId: string | null): SessionData | undefined {
  return useQuery(sessionStreamQueryOptions(sessionId)).data;
}
