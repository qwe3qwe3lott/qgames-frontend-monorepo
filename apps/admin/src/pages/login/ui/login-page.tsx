import {LoginForm} from '@/features/login';

export interface LoginPageProps {
  redirect: string | undefined;
}

/** Вход администратора по логину и паролю; регистрации нет. */
export function LoginPage({redirect}: LoginPageProps) {
  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
      <h1 className="text-3xl font-bold">Вход</h1>
      <LoginForm redirect={redirect} />
    </main>
  );
}
