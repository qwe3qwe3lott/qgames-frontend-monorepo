import {zodResolver} from '@hookform/resolvers/zod';
import {
  getGetCurrentUserQueryKey,
  useAddPasswordLogin,
} from '@qgames/api/gateway';
import {AddPasswordLoginBody} from '@qgames/api/gateway/zod';
import {Button} from '@qgames/ui/components/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@qgames/ui/components/field';
import {Input} from '@qgames/ui/components/input';
import {useQueryClient} from '@tanstack/react-query';
import {useForm} from 'react-hook-form';
import type {z} from 'zod';

import {applyFieldErrors, errorMessage} from '@/shared/lib';

type SetPasswordValues = z.infer<typeof AddPasswordLoginBody>;

const SET_PASSWORD_MESSAGES = {
  LOGIN_METHOD_ALREADY_LINKED: 'Пароль уже задан.',
};

/** Вход по паролю для аккаунта без пароля (например, созданного через Google). */
export function SetPasswordForm() {
  const queryClient = useQueryClient();
  const form = useForm<SetPasswordValues>({
    resolver: zodResolver(AddPasswordLoginBody),
    defaultValues: {password: ''},
  });
  const setPassword = useAddPasswordLogin({
    mutation: {
      onSuccess: user => {
        queryClient.setQueryData(getGetCurrentUserQueryKey(), user);
        form.reset();
      },
      onError: error => {
        if (!applyFieldErrors(error, form.setError, ['password'])) {
          form.setError('root', {
            message: errorMessage(error, SET_PASSWORD_MESSAGES),
          });
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
          setPassword.mutate({data: values});
        })(event);
      }}
    >
      <FieldGroup>
        <Field data-invalid={errors.password !== undefined}>
          <FieldLabel htmlFor="set-password">Пароль</FieldLabel>
          <Input
            id="set-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.password !== undefined}
            {...form.register('password')}
          />
          <FieldDescription>
            Логином станет email аккаунта. От 8 до 128 символов.
          </FieldDescription>
          <FieldError errors={[errors.password]} />
        </Field>
        <FieldError errors={[errors.root]} />
        <Button
          type="submit"
          variant="outline"
          className="self-start"
          disabled={setPassword.isPending}
        >
          Добавить пароль
        </Button>
      </FieldGroup>
    </form>
  );
}
