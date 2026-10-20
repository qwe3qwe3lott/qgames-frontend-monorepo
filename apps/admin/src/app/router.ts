import {isApiError} from '@qgames/api';
import {QueryClient} from '@tanstack/react-query';
import {createRouter} from '@tanstack/react-router';

import {routeTree} from './routeTree.gen';

const MAX_RETRIES = 2;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Ответы 4xx — окончательные (401, 404, ...), повторять имеет смысл только сбои.
      retry: (failureCount, error) =>
        !(isApiError(error) && error.status >= 400 && error.status < 500) &&
        failureCount < MAX_RETRIES,
    },
  },
});

export const router = createRouter({
  routeTree,
  context: {queryClient},
  defaultPreload: 'intent',
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
