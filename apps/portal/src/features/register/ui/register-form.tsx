import {zodResolver} from '@hookform/resolvers/zod';
import {useRegister} from '@qgames/api/gateway';
import {
  AVATAR_LABELS,
  PLAYER_AVATARS,
  PlayerAvatar,
} from '@qgames/game-ui/components/player-avatar';
import {Button} from '@qgames/ui/components/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@qgames/ui/components/field';
import {Input} from '@qgames/ui/components/input';
import {Label} from '@qgames/ui/components/label';
import {RadioGroup, RadioGroupItem} from '@qgames/ui/components/radio-group';
import {useNavigate} from '@tanstack/react-router';
import {Controller, useForm} from 'react-hook-form';

import {applyFieldErrors, errorMessage} from '@/shared/lib';

import {registerSchema, type RegisterValues} from '../model/schema';

const REGISTER_FIELDS = ['email', 'password', 'nickname', 'avatar'] as const;

const REGISTER_MESSAGES = {
  EMAIL_ALREADY_REGISTERED: 'Этот email уже зарегистрирован.',
};

export interface RegisterFormProps {
  redirect: string | undefined;
}

export function RegisterForm({redirect}: RegisterFormProps) {
  const navigate = useNavigate();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {email: '', password: '', nickname: '', avatar: 'CAT'},
  });
  const register = useRegister({
    mutation: {
      onSuccess: (_, {data}) => {
        void navigate({
          to: '/verify-email',
          search: {email: data.email, redirect},
        });
      },
      onError: error => {
        if (!applyFieldErrors(error, form.setError, REGISTER_FIELDS)) {
          form.setError('root', {
            message: errorMessage(error, REGISTER_MESSAGES),
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
          register.mutate({data: values});
        })(event);
      }}
    >
      <FieldGroup>
        <Field data-invalid={errors.email !== undefined}>
          <FieldLabel htmlFor="register-email">Email</FieldLabel>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email !== undefined}
            {...form.register('email')}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field data-invalid={errors.password !== undefined}>
          <FieldLabel htmlFor="register-password">Пароль</FieldLabel>
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.password !== undefined}
            {...form.register('password')}
          />
          <FieldError errors={[errors.password]} />
        </Field>
        <Field data-invalid={errors.nickname !== undefined}>
          <FieldLabel htmlFor="register-nickname">Ник</FieldLabel>
          <Input
            id="register-nickname"
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
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="flex gap-4"
              >
                {PLAYER_AVATARS.map(avatar => (
                  <Label
                    key={avatar}
                    htmlFor={`register-avatar-${avatar}`}
                    className="flex items-center gap-2"
                  >
                    <RadioGroupItem
                      id={`register-avatar-${avatar}`}
                      value={avatar}
                    />
                    <PlayerAvatar avatar={avatar} />
                    {AVATAR_LABELS[avatar]}
                  </Label>
                ))}
              </RadioGroup>
            )}
          />
          <FieldError errors={[errors.avatar]} />
        </FieldSet>
        <FieldError errors={[errors.root]} />
        <Button type="submit" disabled={register.isPending}>
          Зарегистрироваться
        </Button>
      </FieldGroup>
    </form>
  );
}
