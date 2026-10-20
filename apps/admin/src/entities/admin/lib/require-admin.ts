import {getGetCurrentAdminQueryOptions} from '@qgames/api/admin-gateway';
import type {AdminResponse} from '@qgames/api/admin-gateway/model';
import type {QueryClient} from '@tanstack/react-query';
import {redirect} from '@tanstack/react-router';

import {isGuestError} from './guest';

/**
 * Для `beforeLoad` защищённых маршрутов: гостя отправляет на /login с возвратом обратно.
 */
export async function requireAdmin(
  queryClient: QueryClient,
  location: {href: string},
): Promise<AdminResponse> {
  try {
    // staleTime 'static' — взять из кеша, если администратор уже загружен.
    return await queryClient.query({
      ...getGetCurrentAdminQueryOptions(),
      staleTime: 'static',
    });
  } catch (error) {
    if (isGuestError(error)) {
      throw redirect({to: '/login', search: {redirect: location.href}});
    }
    throw error;
  }
}
