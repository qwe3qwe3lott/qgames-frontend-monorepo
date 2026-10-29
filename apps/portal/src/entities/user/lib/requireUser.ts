import {isApiError} from '@qgames/api';
import {getGetCurrentUserQueryOptions} from '@qgames/api/portal';
import type {QueryClient} from '@tanstack/react-query';

import {toViewer, type Viewer} from '../model/types';

/** Страницу открывает гость: маршрут показывает окно входа вместо содержимого. */
export class GuestError extends Error {
  constructor() {
    super('Нужно войти');
    this.name = 'GuestError';
  }
}

/**
 * Для `beforeLoad` авторизованной зоны: текущий пользователь или {@link GuestError}
 * для гостя (ответ 401). Адрес страницы не меняется.
 */
export async function requireUser(queryClient: QueryClient): Promise<Viewer> {
  try {
    // staleTime 'static' — взять из кеша, если пользователь уже загружен.
    const user = await queryClient.query({
      ...getGetCurrentUserQueryOptions(),
      staleTime: 'static',
    });
    return toViewer(user);
  } catch (error) {
    if (isApiError(error) && error.status === 401) {
      throw new GuestError();
    }
    throw error;
  }
}
