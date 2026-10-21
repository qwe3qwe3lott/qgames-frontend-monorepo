import {zodResolver} from '@hookform/resolvers/zod';
import {errorMessage} from '@qgames/api';
import {
  getGetCurrentUserQueryKey,
  useResendCode,
  useVerifyEmail,
} from '@qgames/api/gateway';
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
import {useNavigate} from '@tanstack/react-router';
import {useState} from 'react';
import {useForm} from 'react-hook-form';

import {verifyEmailSchema, type VerifyEmailValues} from '../model/schema';

const VERIFY_MESSAGES = {
  INVALID_VERIFICATION_CODE: 'Неверный код.',
  VERIFICATION_CODE_EXPIRED: 'Код истёк — отправьте новый.',
  TOO_MANY_VERIFICATION_ATTEMPTS: 'Попытки закончились — отправьте новый код.',
  EMAIL_ALREADY_VERIFIED: 'Email уже подтверждён — просто войдите.',
};

const RESEND_MESSAGES = {
  RESEND_COOLDOWN: 'Код отправлялся меньше минуты назад — подождите немного.',
};

export interface VerifyEmailFormProps {
  email: string;
  redirect: string | undefined;
}

export function VerifyEmailForm({email, redirect}: VerifyEmailFormProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const form = useForm<VerifyEmailValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {code: ''},
  });
  const verify = useVerifyEmail({
    mutation: {
      onSuccess: user => {
        // Подтверждение сразу открывает сессию: куки уже стоят.
        queryClient.setQueryData(getGetCurrentUserQueryKey(), user);
        void navigate({href: redirect ?? '/'});
      },
      onError: error => {
        form.setError('code', {message: errorMessage(error, VERIFY_MESSAGES)});
      },
    },
  });
  const resend = useResendCode({
    mutation: {
      onSuccess: () => {
        setResendStatus('Новый код отправлен.');
      },
      onError: error => {
        setResendStatus(errorMessage(error, RESEND_MESSAGES));
      },
    },
  });
  const {errors} = form.formState;

  return (
    <form
      noValidate
      onSubmit={event => {
        void form.handleSubmit(values => {
          verify.mutate({data: {email, code: values.code}});
        })(event);
      }}
    >
      <FieldGroup>
        <Field data-invalid={errors.code !== undefined}>
          <FieldLabel htmlFor="verify-code">Код из письма</FieldLabel>
          <Input
            id="verify-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            aria-invalid={errors.code !== undefined}
            {...form.register('code')}
          />
          <FieldDescription>Отправили на {email}</FieldDescription>
          <FieldError errors={[errors.code]} />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={verify.isPending}>
            Подтвердить
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={resend.isPending}
            onClick={() => {
              setResendStatus(null);
              resend.mutate({data: {email}});
            }}
          >
            Отправить код ещё раз
          </Button>
        </div>
        {resendStatus === null ? null : (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {resendStatus}
          </p>
        )}
      </FieldGroup>
    </form>
  );
}
