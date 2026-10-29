import {createFileRoute, Outlet} from '@tanstack/react-router';

import {GuestError, requireUser} from '@/entities/user';
import {AuthRequiredPage} from '@/pages/authRequired';
import {ErrorPage} from '@/pages/error';

/**
 * Авторизованная зона: гостю вместо страницы показывается окно входа и регистрации,
 * адрес (например, ссылка на комнату) не меняется. Загрузчики дочерних маршрутов
 * гостю не запускаются: `beforeLoad` бросает {@link GuestError} до них.
 */
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({context}) => ({
    viewer: await requireUser(context.queryClient),
  }),
  errorComponent: ({error, reset}) =>
    error instanceof GuestError ? (
      <AuthRequiredPage />
    ) : (
      <ErrorPage error={error} onRetry={reset} />
    ),
  component: Outlet,
});
