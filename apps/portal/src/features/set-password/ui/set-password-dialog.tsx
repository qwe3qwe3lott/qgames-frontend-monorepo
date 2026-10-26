import {zodResolver} from '@hookform/resolvers/zod';
import {applyFieldErrors, errorMessage} from '@qgames/api';
import {
  getGetCurrentUserQueryKey,
  useAddPasswordLogin,
} from '@qgames/api/portal';
import {Button} from '@qgames/ui/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@qgames/ui/components/dialog';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@qgames/ui/components/field';
import {Input} from '@qgames/ui/components/input';
import {toast} from '@qgames/ui/components/sonner';
import {useQueryClient} from '@tanstack/react-query';
import {useState} from 'react';
import {useForm} from 'react-hook-form';

import {setPasswordSchema, type SetPasswordValues} from '../model/schema';

const SET_PASSWORD_MESSAGES = {
  LOGIN_METHOD_ALREADY_LINKED: 'Пароль уже задан.',
};

const DEFAULT_VALUES: SetPasswordValues = {password: '', passwordConfirm: ''};

/** Вход по паролю для аккаунта без пароля (например, созданного через Google). */
export function SetPasswordDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const form = useForm<SetPasswordValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const setPassword = useAddPasswordLogin({
    mutation: {
      onSuccess: user => {
        queryClient.setQueryData(getGetCurrentUserQueryKey(), user);
        setOpen(false);
        toast.success('Пароль установлен');
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
    <Dialog
      open={open}
      onOpenChange={next => {
        setOpen(next);
        if (!next) {
          form.reset(DEFAULT_VALUES);
          setPassword.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="self-start">
          Задать пароль
        </Button>
      </DialogTrigger>
      {/* Подзаголовка у окна нет: описание стоит у поля пароля. */}
      <DialogContent aria-describedby={undefined}>
        <form
          noValidate
          className="grid gap-4"
          // Вставка из буфера запрещена: пароль и его повтор вводятся руками.
          onPaste={event => {
            event.preventDefault();
          }}
          onSubmit={event => {
            void form.handleSubmit(({password}) => {
              setPassword.mutate({data: {password}});
            })(event);
          }}
        >
          <DialogHeader>
            <DialogTitle>Вход по паролю</DialogTitle>
          </DialogHeader>
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
              <FieldDescription>От 8 до 128 символов.</FieldDescription>
              <FieldError errors={[errors.password]} />
            </Field>
            <Field data-invalid={errors.passwordConfirm !== undefined}>
              <FieldLabel htmlFor="set-password-confirm">
                Повтор пароля
              </FieldLabel>
              <Input
                id="set-password-confirm"
                type="password"
                autoComplete="new-password"
                aria-invalid={errors.passwordConfirm !== undefined}
                {...form.register('passwordConfirm')}
              />
              <FieldError errors={[errors.passwordConfirm]} />
            </Field>
            <FieldError errors={[errors.root]} />
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Отмена
              </Button>
            </DialogClose>
            <Button type="submit" disabled={setPassword.isPending}>
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
