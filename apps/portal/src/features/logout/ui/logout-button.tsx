import {useLogout} from '@qgames/api/gateway';
import {Button} from '@qgames/ui/components/button';
import {useQueryClient} from '@tanstack/react-query';
import {useNavigate} from '@tanstack/react-router';

/** Выход: сессия отзывается, все данные пользователя убираются из кеша. */
export function LogoutButton() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const logout = useLogout({
    mutation: {
      onSettled: () => {
        queryClient.clear();
        void navigate({to: '/'});
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
