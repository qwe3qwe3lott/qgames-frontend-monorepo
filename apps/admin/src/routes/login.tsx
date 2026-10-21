import {createFileRoute} from '@tanstack/react-router';

import {LoginPage} from '@/pages/login';

import {loginSearchSchema} from './-search';

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  component: LoginRoute,
});

function LoginRoute() {
  const {redirect} = Route.useSearch();
  return <LoginPage redirect={redirect} />;
}
