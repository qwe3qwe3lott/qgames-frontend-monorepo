import {Link} from '@tanstack/react-router';

import {GoogleLoginButton} from '@/features/google-login';
import {RegisterForm} from '@/features/register';
import {PageLayout} from '@/shared/ui';

export interface RegisterPageProps {
  redirect: string | undefined;
}

export function RegisterPage({redirect}: RegisterPageProps) {
  return (
    <PageLayout
      title="Регистрация"
      description="После регистрации пришлём на email код подтверждения."
    >
      <div className="flex max-w-sm flex-col gap-6">
        <RegisterForm redirect={redirect} />
        <GoogleLoginButton redirect={redirect} text="signup_with" />
        <p className="text-sm text-muted-foreground">
          Уже есть аккаунт?{' '}
          <Link to="/login" search={{redirect}} className="underline">
            Войдите
          </Link>
        </p>
      </div>
    </PageLayout>
  );
}
