import {getGetCurrentUserQueryKey} from '@qgames/api/portal';
import type {UserResponse} from '@qgames/api/portal/model';
import {useQueryClient} from '@tanstack/react-query';
import {useRouter} from '@tanstack/react-router';

/**
 * После входа или регистрации: пользователь — в кеш, данные, загруженные гостем,
 * перечитываются, маршрут перезагружается (авторизованная зона откроет страницу
 * по тому же адресу).
 */
export function useAuthSuccess(onDone: () => void) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return async (user: UserResponse) => {
    queryClient.setQueryData(getGetCurrentUserQueryKey(), user);
    onDone();
    await queryClient.invalidateQueries({
      predicate: query => query.queryKey[0] !== getGetCurrentUserQueryKey()[0],
    });
    await router.invalidate();
  };
}
