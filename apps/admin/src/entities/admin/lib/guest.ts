import {isApiError} from '@qgames/api';

/**
 * Ошибка `GET /api/admin/admins/me`, после которой администратор считается гостем:
 * 401 (сессии нет или refresh не удался) или 404 ADMIN_NOT_FOUND (администратора
 * из сессии больше нет).
 */
export function isGuestError(error: unknown): boolean {
  return (
    isApiError(error) &&
    (error.status === 401 || error.code === 'ADMIN_NOT_FOUND')
  );
}
