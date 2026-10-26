import {errorMessage} from '@qgames/api';
import {getGetCurrentUserQueryKey, useAddGoogleLogin} from '@qgames/api/portal';
import {toast} from '@qgames/ui/components/sonner';
import {useQueryClient} from '@tanstack/react-query';

import {env} from '@/shared/config';
import {GoogleButton} from '@/shared/ui';

const LINK_GOOGLE_MESSAGES = {
  LOGIN_METHOD_ALREADY_LINKED: 'Google уже привязан к аккаунту.',
  GOOGLE_ACCOUNT_ALREADY_LINKED:
    'Этот Google-аккаунт привязан к другому пользователю.',
  INVALID_GOOGLE_TOKEN: 'Не удалось привязать Google, попробуйте ещё раз.',
};

/** Привязка Google к текущему аккаунту: после неё можно входить через этот Google-аккаунт. */
export function LinkGoogleButton() {
  const queryClient = useQueryClient();
  const link = useAddGoogleLogin({
    mutation: {
      onSuccess: user => {
        queryClient.setQueryData(getGetCurrentUserQueryKey(), user);
        toast.success('Аккаунт Google привязан');
      },
      onError: error => {
        toast.error(errorMessage(error, LINK_GOOGLE_MESSAGES));
      },
    },
  });
  const clientId = env.PUBLIC_GOOGLE_CLIENT_ID;
  if (clientId === undefined) {
    return (
      <p className="text-sm text-muted-foreground">
        Вход через Google не настроен.
      </p>
    );
  }

  return (
    <GoogleButton
      clientId={clientId}
      text="continue_with"
      onCredential={idToken => {
        link.mutate({data: {idToken}});
      }}
    />
  );
}
