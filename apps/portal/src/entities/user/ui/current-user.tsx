import {isApiError} from '@qgames/api';
import {useGetCurrentUser} from '@qgames/api/gateway';

/** Email текущего пользователя или «гость», если сессии нет. */
export function CurrentUser() {
  const {data, error, isPending} = useGetCurrentUser({query: {retry: false}});

  if (isPending) {
    return <span className="text-muted-foreground">Загрузка…</span>;
  }
  if (isApiError(error) && error.code === 'UNAUTHENTICATED') {
    return <span>Гость</span>;
  }
  if (error !== null) {
    return (
      <span className="text-destructive">Не удалось загрузить профиль</span>
    );
  }
  return <span>{data.email}</span>;
}
