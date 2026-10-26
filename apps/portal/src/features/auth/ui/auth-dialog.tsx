import {errorMessage, isApiError} from '@qgames/api';
import {useLoginWithGoogle} from '@qgames/api/portal';
import {Button} from '@qgames/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@qgames/ui/components/dialog';
import {useState} from 'react';

import {env} from '@/shared/config';
import {GoogleButton} from '@/shared/ui';

import {useAuthSuccess} from '../lib/use-auth-success';
import {LoginForm} from './login-form';
import {RegisterForm} from './register-form';

const GOOGLE_LOGIN_MESSAGES = {
  INVALID_GOOGLE_TOKEN: 'Не удалось войти через Google, попробуйте ещё раз.',
};

type Mode = 'login' | 'register';

export interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Подзаголовок окна — например, зачем нужен вход. */
  description?: string;
}

/**
 * Вход и регистрация в одном окне. Вход — по логину и паролю или через Google;
 * если Google-аккаунт ещё не зарегистрирован, окно переходит к регистрации с уже
 * выбранным аккаунтом Google. После успеха текущий маршрут перезагружается.
 */
export function AuthDialog({open, onOpenChange, description}: AuthDialogProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [idToken, setIdToken] = useState<string | null>(null);
  const onSuccess = useAuthSuccess(() => {
    onOpenChange(false);
  });
  const googleLogin = useLoginWithGoogle({
    mutation: {
      onSuccess,
      onError: (error, {data}) => {
        if (isApiError(error) && error.code === 'REGISTRATION_REQUIRED') {
          setIdToken(data.idToken);
          setMode('register');
        }
      },
    },
  });
  const clientId = env.PUBLIC_GOOGLE_CLIENT_ID;
  const switchMode = (next: Mode) => {
    setMode(next);
    setIdToken(null);
    googleLogin.reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        onOpenChange(next);
        if (!next) {
          switchMode('login');
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'login' ? 'Вход' : 'Регистрация'}</DialogTitle>
          <DialogDescription>
            {description ??
              (mode === 'login'
                ? 'Войдите по логину и паролю или через Google.'
                : 'Придумайте логин и подтвердите личность через Google.')}
          </DialogDescription>
        </DialogHeader>
        {mode === 'login' ? (
          <div className="flex flex-col gap-4">
            <LoginForm
              onSuccess={user => {
                void onSuccess(user);
              }}
            />
            {clientId === undefined ? null : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  или
                  <span className="h-px flex-1 bg-border" />
                </div>
                <GoogleButton
                  clientId={clientId}
                  text="signin_with"
                  onCredential={token => {
                    googleLogin.mutate({data: {idToken: token}});
                  }}
                />
                {googleLogin.isError &&
                !(
                  isApiError(googleLogin.error) &&
                  googleLogin.error.code === 'REGISTRATION_REQUIRED'
                ) ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errorMessage(googleLogin.error, GOOGLE_LOGIN_MESSAGES)}
                  </p>
                ) : null}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Нет аккаунта?{' '}
              <Button
                type="button"
                variant="link"
                className="h-auto p-0"
                onClick={() => {
                  switchMode('register');
                }}
              >
                Зарегистрироваться
              </Button>
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {idToken === null ? null : (
              <p className="text-sm">
                Этот аккаунт Google ещё не зарегистрирован. Придумайте логин,
                чтобы создать аккаунт.
              </p>
            )}
            <RegisterForm
              idToken={idToken}
              onIdTokenChange={setIdToken}
              onSuccess={user => {
                void onSuccess(user);
              }}
              onSignIn={() => {
                switchMode('login');
              }}
            />
            <p className="text-sm text-muted-foreground">
              Уже есть аккаунт?{' '}
              <Button
                type="button"
                variant="link"
                className="h-auto p-0"
                onClick={() => {
                  switchMode('login');
                }}
              >
                Войти
              </Button>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
