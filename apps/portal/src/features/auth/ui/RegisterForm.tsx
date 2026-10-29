import {zodResolver} from '@hookform/resolvers/zod';
import {applyFieldErrors, isApiError} from '@qgames/api';
import {useRegisterWithGoogle} from '@qgames/api/portal';
import type {UserResponse} from '@qgames/api/portal/model';
import {Button} from '@qgames/ui/components/Button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@qgames/ui/components/Field';
import {Input} from '@qgames/ui/components/Input';
import {useForm} from 'react-hook-form';

import {env} from '@/shared/config';
import {GoogleButton} from '@/shared/ui';

import {registerFormSchema, type RegisterFormValues} from '../model/schema';

const DEFAULT_VALUES: RegisterFormValues = {
  login: '',
  password: '',
  passwordConfirm: '',
};

export interface RegisterFormProps {
  /** ID token Google, если аккаунт Google уже выбран (например, при входе). */
  idToken: string | null;
  onIdTokenChange: (idToken: string | null) => void;
  onSuccess: (user: UserResponse) => void;
  onSignIn: () => void;
}

/**
 * Регистрация: логин (задаётся один раз), необязательный пароль и подтверждение
 * через Google — всё уходит одним запросом.
 */
export function RegisterForm({
  idToken,
  onIdTokenChange,
  onSuccess,
  onSignIn,
}: RegisterFormProps) {
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const register = useRegisterWithGoogle({
    mutation: {
      onSuccess,
      onError: error => {
        if (isApiError(error) && error.code === 'LOGIN_TAKEN') {
          form.setError('login', {message: 'Логин занят, выберите другой'});
          return;
        }
        if (isApiError(error) && error.code === 'INVALID_GOOGLE_TOKEN') {
          onIdTokenChange(null);
          form.setError('root', {
            message:
              'Подтверждение Google устарело — выберите аккаунт Google ещё раз.',
          });
          return;
        }
        if (isApiError(error) && error.code === 'ACCOUNT_ALREADY_EXISTS') {
          form.setError('root', {
            message: 'Этот аккаунт Google уже зарегистрирован — войдите.',
          });
          return;
        }
        if (!applyFieldErrors(error, form.setError, ['login', 'password'])) {
          form.setError('root', {message: 'Не удалось зарегистрироваться.'});
        }
      },
    },
  });
  const {errors} = form.formState;
  const clientId = env.PUBLIC_GOOGLE_CLIENT_ID;
  const accountExists =
    isApiError(register.error) &&
    register.error.code === 'ACCOUNT_ALREADY_EXISTS';

  const submit = (token: string) => {
    void form.handleSubmit(({login, password}) => {
      // Пустой пароль — регистрация без входа по паролю.
      register.mutate({
        data:
          password === ''
            ? {idToken: token, login}
            : {idToken: token, login, password},
      });
    })();
  };

  if (clientId === undefined && idToken === null) {
    return (
      <p className="text-sm text-muted-foreground">
        Регистрация через Google не настроена.
      </p>
    );
  }
  const loginField = form.register('login');

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={event => {
        event.preventDefault();
        if (idToken !== null) {
          submit(idToken);
        }
      }}
    >
      <FieldGroup>
        <Field data-invalid={errors.login !== undefined}>
          <FieldLabel htmlFor="register-login">Логин</FieldLabel>
          <Input
            id="register-login"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={errors.login !== undefined}
            {...loginField}
            onChange={event => {
              event.target.value = event.target.value.toLowerCase();
              void loginField.onChange(event);
            }}
          />
          <FieldDescription>
            Логин нельзя будет изменить. Ник, который видят другие игроки,
            сначала совпадает с логином — его можно поменять в профиле в любой
            момент.
          </FieldDescription>
          <FieldError errors={[errors.login]} />
        </Field>
        <Field data-invalid={errors.password !== undefined}>
          <FieldLabel htmlFor="register-password">
            Пароль (необязательно)
          </FieldLabel>
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.password !== undefined}
            {...form.register('password')}
          />
          <FieldDescription>
            От 8 до 128 символов — чтобы входить по логину и паролю. Можно
            задать позже в профиле.
          </FieldDescription>
          <FieldError errors={[errors.password]} />
        </Field>
        <Field data-invalid={errors.passwordConfirm !== undefined}>
          <FieldLabel htmlFor="register-password-confirm">
            Повтор пароля
          </FieldLabel>
          <Input
            id="register-password-confirm"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.passwordConfirm !== undefined}
            {...form.register('passwordConfirm')}
          />
          <FieldError errors={[errors.passwordConfirm]} />
        </Field>
        <FieldError errors={[errors.root]} />
        {accountExists ? (
          <Button
            type="button"
            variant="outline"
            onClick={onSignIn}
            className="self-start"
          >
            Войти
          </Button>
        ) : null}
        {idToken === null && clientId !== undefined ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Подтвердите личность через Google, чтобы создать аккаунт:
            </p>
            <GoogleButton
              clientId={clientId}
              text="signup_with"
              onCredential={token => {
                onIdTokenChange(token);
                submit(token);
              }}
            />
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Аккаунт Google выбран.
            </p>
            <Button type="submit" disabled={register.isPending}>
              Зарегистрироваться
            </Button>
          </>
        )}
      </FieldGroup>
    </form>
  );
}
