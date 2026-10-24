import {zodResolver} from '@hookform/resolvers/zod';
import {applyFieldErrors, errorMessage} from '@qgames/api';
import {getGetCurrentUserQueryKey, useLogin} from '@qgames/api/portal';
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

const LOGIN_MESSAGES = {
  INVALID_CREDENTIALS: 'Неверный email или пароль.',
};

export interface LoginFormProps {
  /** Куда вернуться после входа. */
  redirect: string | undefined;
}

export function LoginForm({redirect}: LoginFormProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {email: '', password: ''},
  });
  const login = useLogin({
    mutation: {
      onSuccess: user => {
        queryClient.setQueryData(getGetCurrentUserQueryKey(), user);
        void navigate({href: redirect ?? '/'});
      },
      onError: error => {
        if (!applyFieldErrors(error, form.setError, ['email', 'password'])) {
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
        <Field data-invalid={errors.email !== undefined}>
          <FieldLabel htmlFor="login-email">Email</FieldLabel>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email !== undefined}
            {...form.register('email')}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field data-invalid={errors.password !== undefined}>
          <FieldLabel htmlFor="login-password">Пароль</FieldLabel>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.password !== undefined}
            {...form.register('password')}
          />
          <FieldError errors={[errors.password]} />
        </Field>
        <FieldError errors={[errors.root]} />
        <Button type="submit" disabled={login.isPending}>
          Войти
        </Button>
      </FieldGroup>
    </form>
  );
}
