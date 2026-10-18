import {Link} from '@tanstack/react-router';

import {LoginForm} from '@/features/login';
import {PageLayout} from '@/shared/ui';

export interface LoginPageProps {
  redirect: string | undefined;
}

export function LoginPage({redirect}: LoginPageProps) {
  return (
    <PageLayout title="Вход">
      <div className="flex max-w-sm flex-col gap-6">
        <LoginForm redirect={redirect} />
        <p className="text-sm text-muted-foreground">
          Нет аккаунта?{' '}
          <Link to="/register" search={{redirect}} className="underline">
            Зарегистрируйтесь
          </Link>
        </p>
      </div>
    </PageLayout>
  );
}
