import {PageLayout} from '@qgames/ui/components/page-layout';

import {GoogleLoginButton} from '@/features/google-login';
import {LoginForm} from '@/features/login';

export interface LoginPageProps {
  redirect: string | undefined;
}

export function LoginPage({redirect}: LoginPageProps) {
  return (
    <PageLayout title="Вход">
      <div className="flex max-w-sm flex-col gap-6">
        <LoginForm redirect={redirect} />
        <GoogleLoginButton redirect={redirect} />
      </div>
    </PageLayout>
  );
}
