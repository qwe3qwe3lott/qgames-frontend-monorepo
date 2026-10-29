import {errorMessage, isApiError} from '@qgames/api';
import {useLogout} from '@qgames/api/admin';
import {Button} from '@qgames/ui/components/button';
import {toast} from '@qgames/ui/components/sonner';
import {useQueryClient} from '@tanstack/react-query';
import {useNavigate} from '@tanstack/react-router';

import {testIds} from './logout-button.test-ids';

/**
 * Выход: сессия отзывается, все данные администратора убираются из кеша.
 * Если отозвать сессию не удалось, администратор остаётся на странице и видит снекбар;
 * `UNAUTHENTICATED` значит, что сессии уже нет, — это тоже выход.
 */
export function LogoutButton() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const leave = async () => {
    // Сначала уходим со страницы, чтобы её запросы не перезапросились с 401.
    await navigate({to: '/login', search: {redirect: undefined}});
    // Не clear(): он не уведомляет подписчиков, и смонтированная шапка
    // продолжала бы показывать администратора. reset стирает данные всех
    // запросов и перезапрашивает активные — текущий администратор станет гостем (401).
    await queryClient.resetQueries();
  };
  const logout = useLogout({
    mutation: {
      onSuccess: leave,
      onError: async error => {
        if (isApiError(error) && error.code === 'UNAUTHENTICATED') {
          await leave();
          return;
        }
        toast.error('Не удалось выйти', {description: errorMessage(error)});
      },
    },
  });
  return (
    <Button
      variant="ghost"
      size="sm"
      data-testid={testIds.root}
      disabled={logout.isPending}
      onClick={() => {
        logout.mutate();
      }}
    >
      Выйти
    </Button>
  );
}
