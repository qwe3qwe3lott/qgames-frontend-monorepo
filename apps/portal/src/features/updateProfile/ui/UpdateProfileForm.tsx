import {zodResolver} from '@hookform/resolvers/zod';
import {applyFieldErrors, errorMessage} from '@qgames/api';
import {getGetCurrentUserQueryKey, useUpdateProfile} from '@qgames/api/portal';
import type {UpdateProfileRequest} from '@qgames/api/portal/model';
import {Button} from '@qgames/ui/components/Button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@qgames/ui/components/Field';
import {Input} from '@qgames/ui/components/Input';
import {toast} from '@qgames/ui/components/Sonner';
import {useQueryClient} from '@tanstack/react-query';
import {Controller, useForm} from 'react-hook-form';

import {AvatarPicker} from '@/entities/user';

import {updateProfileSchema, type UpdateProfileValues} from '../model/schema';

export interface UpdateProfileFormProps {
  /** Текущие значения профиля. */
  defaults: UpdateProfileValues;
}

/** Смена ника и аватара: на бэкенд уходят только изменённые поля. */
export function UpdateProfileForm({defaults}: UpdateProfileFormProps) {
  const queryClient = useQueryClient();
  const form = useForm<UpdateProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: defaults,
  });
  const updateProfile = useUpdateProfile({
    mutation: {
      onSuccess: user => {
        queryClient.setQueryData(getGetCurrentUserQueryKey(), user);
        form.reset({nickname: user.nickname, avatar: user.avatar});
        toast.success('Профиль сохранён');
      },
      onError: error => {
        if (!applyFieldErrors(error, form.setError, ['nickname', 'avatar'])) {
          form.setError('root', {message: errorMessage(error)});
        }
      },
    },
  });
  const {errors, dirtyFields, isDirty} = form.formState;

  return (
    <form
      noValidate
      onSubmit={event => {
        void form.handleSubmit(values => {
          const request: UpdateProfileRequest = {};
          if (dirtyFields.nickname === true) {
            request.nickname = values.nickname;
          }
          if (dirtyFields.avatar === true) {
            request.avatar = values.avatar;
          }
          updateProfile.mutate({data: request});
        })(event);
      }}
    >
      <FieldGroup>
        <Field data-invalid={errors.nickname !== undefined}>
          <FieldLabel htmlFor="profile-nickname">Ник</FieldLabel>
          <Input
            id="profile-nickname"
            autoComplete="nickname"
            aria-invalid={errors.nickname !== undefined}
            {...form.register('nickname')}
          />
          <FieldError errors={[errors.nickname]} />
        </Field>
        <FieldSet>
          <FieldLegend variant="label">Аватар</FieldLegend>
          <Controller
            control={form.control}
            name="avatar"
            render={({field}) => (
              <AvatarPicker
                idPrefix="profile-avatar"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </FieldSet>
        <FieldError errors={[errors.root]} />
        <div>
          <Button type="submit" disabled={!isDirty || updateProfile.isPending}>
            Сохранить
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
