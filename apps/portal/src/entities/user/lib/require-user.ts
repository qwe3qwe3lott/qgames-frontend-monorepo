import {isApiError} from '@qgames/api';
import {getGetCurrentUserQueryOptions} from '@qgames/api/portal';
import type {QueryClient} from '@tanstack/react-query';
import {redirect} from '@tanstack/react-router';

import {toViewer, type Viewer} from '../model/types';

/**
 * Для `beforeLoad` защищённых маршрутов: гостя отправляет на /login с возвратом обратно.
 */
export async function requireUser(
  queryClient: QueryClient,
  location: {href: string},
): Promise<Viewer> {
  try {
    // staleTime 'static' — взять из кеша, если пользователь уже загружен.
    const user = await queryClient.query({
      ...getGetCurrentUserQueryOptions(),
      staleTime: 'static',
    });
    return toViewer(user);
  } catch (error) {
    if (isApiError(error) && error.status === 401) {
      throw redirect({to: '/login', search: {redirect: location.href}});
    }
    throw error;
  }
}
