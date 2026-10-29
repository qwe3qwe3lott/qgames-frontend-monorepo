import {zodResolver} from '@hookform/resolvers/zod';
import {applyFieldErrors, errorMessage} from '@qgames/api';
import {useLogin} from '@qgames/api/portal';
import type {UserResponse} from '@qgames/api/portal/model';
import {Button} from '@qgames/ui/components/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@qgames/ui/components/field';
import {Input} from '@qgames/ui/components/input';
import {useForm} from 'react-hook-form';

import {loginFormSchema, type LoginFormValues} from '../model/schema';
import {testIds} from './login-form.test-ids';

const LOGIN_MESSAGES = {
  INVALID_CREDENTIALS: 'Неверный логин или пароль.',
};

export interface LoginFormProps {
  onSuccess: (user: UserResponse) => void;
}

/** Вход по логину и паролю. */
export function LoginForm({onSuccess}: LoginFormProps) {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {login: '', password: ''},
  });
  const login = useLogin({
    mutation: {
      onSuccess,
      onError: error => {
        if (!applyFieldErrors(error, form.setError, ['login', 'password'])) {
          form.setError('root', {message: errorMessage(error, LOGIN_MESSAGES)});
        }
      },
    },
  });
  const {errors} = form.formState;

  return (
    <form
      noValidate
      onSubmit={event => {
        void form.handleSubmit(values => {
          login.mutate({data: values});
        })(event);
      }}
    >
      <FieldGroup>
        <Field data-invalid={errors.login !== undefined}>
          <FieldLabel htmlFor="auth-login">Логин</FieldLabel>
          <Input
            id="auth-login"
            data-testid={testIds.loginInput}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={errors.login !== undefined}
            {...form.register('login')}
          />
          <FieldError errors={[errors.login]} />
        </Field>
        <Field data-invalid={errors.password !== undefined}>
          <FieldLabel htmlFor="auth-password">Пароль</FieldLabel>
          <Input
            id="auth-password"
            data-testid={testIds.passwordInput}
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.password !== undefined}
            {...form.register('password')}
          />
          <FieldError errors={[errors.password]} />
        </Field>
        <FieldError errors={[errors.root]} />
        <Button
          type="submit"
          disabled={login.isPending}
          data-testid={testIds.submitButton}
        >
          Войти
        </Button>
      </FieldGroup>
    </form>
  );
}
