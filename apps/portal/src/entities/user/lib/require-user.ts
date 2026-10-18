import {isApiError} from '@qgames/api';
import {getGetCurrentUserQueryOptions} from '@qgames/api/gateway';
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
  const loginRedirect = () =>
    redirect({to: '/login', search: {redirect: location.href}});
  try {
    // staleTime 'static' — взять из кеша, если пользователь уже загружен.
    const user = await queryClient.query({
      ...getGetCurrentUserQueryOptions(),
      staleTime: 'static',
    });
    const viewer = toViewer(user);
    if (viewer === null) {
      throw loginRedirect();
    }
    return viewer;
  } catch (error) {
    if (isApiError(error) && error.status === 401) {
      throw loginRedirect();
    }
    throw error;
  }
}
