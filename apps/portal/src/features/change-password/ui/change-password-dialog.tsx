import {zodResolver} from '@hookform/resolvers/zod';
import {applyFieldErrors, errorMessage, isApiError} from '@qgames/api';
import {getGetCurrentUserQueryKey, useChangePassword} from '@qgames/api/portal';
import {Button} from '@qgames/ui/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
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

import {changePasswordSchema, type ChangePasswordValues} from '../model/schema';

const DEFAULT_VALUES: ChangePasswordValues = {
  currentPassword: '',
  newPassword: '',
  newPasswordConfirm: '',
};

/** Смена пароля: другие сессии пользователя завершаются, текущая получает новые куки. */
export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const changePassword = useChangePassword({
    mutation: {
      onSuccess: user => {
        queryClient.setQueryData(getGetCurrentUserQueryKey(), user);
        setOpen(false);
        toast.success('Пароль изменён');
      },
      onError: error => {
        if (isApiError(error) && error.code === 'INVALID_CURRENT_PASSWORD') {
          form.setError('currentPassword', {
            message: 'Неверный текущий пароль.',
          });
          return;
        }
        if (
          !applyFieldErrors(error, form.setError, [
            'currentPassword',
            'newPassword',
          ])
        ) {
          form.setError('root', {message: errorMessage(error, {})});
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
          changePassword.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="self-start">
          Сменить пароль
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          noValidate
          className="grid gap-4"
          // Вставка из буфера запрещена: пароли вводятся руками.
          onPaste={event => {
            event.preventDefault();
          }}
          onSubmit={event => {
            void form.handleSubmit(({currentPassword, newPassword}) => {
              changePassword.mutate({data: {currentPassword, newPassword}});
            })(event);
          }}
        >
          <DialogHeader>
            <DialogTitle>Смена пароля</DialogTitle>
            <DialogDescription>
              После смены пароля вход на других устройствах завершится.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field data-invalid={errors.currentPassword !== undefined}>
              <FieldLabel htmlFor="change-password-current">
                Текущий пароль
              </FieldLabel>
              <Input
                id="change-password-current"
                type="password"
                autoComplete="current-password"
                aria-invalid={errors.currentPassword !== undefined}
                {...form.register('currentPassword')}
              />
              <FieldError errors={[errors.currentPassword]} />
            </Field>
            <Field data-invalid={errors.newPassword !== undefined}>
              <FieldLabel htmlFor="change-password-new">
                Новый пароль
              </FieldLabel>
              <Input
                id="change-password-new"
                type="password"
                autoComplete="new-password"
                aria-invalid={errors.newPassword !== undefined}
                {...form.register('newPassword')}
              />
              <FieldDescription>От 8 до 128 символов.</FieldDescription>
              <FieldError errors={[errors.newPassword]} />
            </Field>
            <Field data-invalid={errors.newPasswordConfirm !== undefined}>
              <FieldLabel htmlFor="change-password-confirm">
                Повтор нового пароля
              </FieldLabel>
              <Input
                id="change-password-confirm"
                type="password"
                autoComplete="new-password"
                aria-invalid={errors.newPasswordConfirm !== undefined}
                {...form.register('newPasswordConfirm')}
              />
              <FieldError errors={[errors.newPasswordConfirm]} />
            </Field>
            <FieldError errors={[errors.root]} />
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Отмена
              </Button>
            </DialogClose>
            <Button type="submit" disabled={changePassword.isPending}>
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
