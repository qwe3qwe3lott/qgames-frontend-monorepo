import {errorMessage} from '@qgames/api';
import {
  getGetCurrentUserQueryKey,
  useLoginWithGoogle,
} from '@qgames/api/gateway';
import {useQueryClient} from '@tanstack/react-query';
import {useNavigate} from '@tanstack/react-router';

import {env} from '@/shared/config';
import {GoogleButton} from '@/shared/ui';

const GOOGLE_LOGIN_MESSAGES = {
  ACCOUNT_LINK_REQUIRED:
    'Аккаунт с этим email уже есть. Войдите по паролю и привяжите Google в профиле.',
  GOOGLE_EMAIL_NOT_VERIFIED: 'Email в Google не подтверждён.',
  INVALID_GOOGLE_TOKEN: 'Не удалось войти через Google, попробуйте ещё раз.',
};

export interface GoogleLoginButtonProps {
  redirect: string | undefined;
}

/**
 * Вход через Google (первый вход создаёт аккаунт); без Client ID в env не показывается.
 */
export function GoogleLoginButton({redirect}: GoogleLoginButtonProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const login = useLoginWithGoogle({
    mutation: {
      onSuccess: user => {
        queryClient.setQueryData(getGetCurrentUserQueryKey(), user);
        void navigate({href: redirect ?? '/'});
      },
    },
  });
  const clientId = env.PUBLIC_GOOGLE_CLIENT_ID;
  if (clientId === undefined) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        или
        <span className="h-px flex-1 bg-border" />
      </div>
      <GoogleButton
        clientId={clientId}
        text="signin_with"
        onCredential={idToken => {
          login.mutate({data: {idToken}});
        }}
      />
      <p className="text-sm text-muted-foreground">
        Нет аккаунта? Войдите через Google — аккаунт создастся автоматически,
        пароль можно добавить в профиле.
      </p>
      {login.isError ? (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage(login.error, GOOGLE_LOGIN_MESSAGES)}
        </p>
      ) : null}
    </div>
  );
}
