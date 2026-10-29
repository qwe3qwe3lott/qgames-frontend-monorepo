import {zodResolver} from '@hookform/resolvers/zod';
import {applyFieldErrors, errorMessage} from '@qgames/api';
import {getGetCurrentAdminQueryKey, useLogin} from '@qgames/api/admin';
import {Button} from '@qgames/ui/components/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@qgames/ui/components/field';
import {Input} from '@qgames/ui/components/input';
import {useQueryClient} from '@tanstack/react-query';
import {useNavigate} from '@tanstack/react-router';
import {useForm} from 'react-hook-form';

import {loginSchema, type LoginValues} from '../model/schema';
import {testIds} from './login-form.test-ids';

const LOGIN_MESSAGES = {
  INVALID_CREDENTIALS: 'Неверный логин или пароль.',
};

export interface LoginFormProps {
  /** Куда вернуться после входа; по умолчанию — список администраторов. */
  redirect: string | undefined;
}

export function LoginForm({redirect}: LoginFormProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {login: '', password: ''},
  });
  const login = useLogin({
    mutation: {
      onSuccess: admin => {
        queryClient.setQueryData(getGetCurrentAdminQueryKey(), admin);
        if (redirect === undefined) {
          void navigate({to: '/admins'});
        } else {
          void navigate({href: redirect});
        }
      },
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
          <FieldLabel htmlFor="login-login">Логин</FieldLabel>
          <Input
            id="login-login"
            data-testid={testIds.loginInput}
            autoComplete="username"
            aria-invalid={errors.login !== undefined}
            {...form.register('login')}
          />
          <FieldError errors={[errors.login]} />
        </Field>
        <Field data-invalid={errors.password !== undefined}>
          <FieldLabel htmlFor="login-password">Пароль</FieldLabel>
          <Input
            id="login-password"
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
