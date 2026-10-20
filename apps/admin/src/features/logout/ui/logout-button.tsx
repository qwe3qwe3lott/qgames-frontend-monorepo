import {useLogout} from '@qgames/api/admin-gateway';
import {Button} from '@qgames/ui/components/button';
import {useQueryClient} from '@tanstack/react-query';
import {useNavigate} from '@tanstack/react-router';

/** Выход: сессия отзывается, все данные администратора убираются из кеша. */
export function LogoutButton() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const logout = useLogout({
    mutation: {
      onSettled: async () => {
        // Сначала уходим со страницы, чтобы её запросы не перезапросились с 401.
        await navigate({to: '/login', search: {redirect: undefined}});
        // Не clear(): он не уведомляет подписчиков, и смонтированная шапка
        // продолжала бы показывать администратора. reset стирает данные всех
        // запросов и перезапрашивает активные — текущий администратор станет гостем (401).
        await queryClient.resetQueries();
      },
    },
  });
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={logout.isPending}
      onClick={() => {
        logout.mutate();
      }}
    >
      Выйти
    </Button>
  );
}
