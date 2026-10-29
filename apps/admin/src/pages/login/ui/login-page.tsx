import {PageLayout} from '@qgames/ui/components/page-layout';

import {LoginForm} from '@/features/login';

import {testIds} from './login-page.test-ids';

export interface LoginPageProps {
  redirect: string | undefined;
}

/** Вход администратора по логину и паролю; регистрации нет. */
export function LoginPage({redirect}: LoginPageProps) {
  return (
    <PageLayout data-testid={testIds.root} title="Вход">
      <div className="flex max-w-sm flex-col gap-6">
        <LoginForm redirect={redirect} />
      </div>
    </PageLayout>
  );
}
