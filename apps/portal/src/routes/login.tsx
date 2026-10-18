import {createFileRoute} from '@tanstack/react-router';

import {LoginPage} from '@/pages/login';

import {authSearchSchema} from './-search';

export const Route = createFileRoute('/login')({
  validateSearch: authSearchSchema,
  component: LoginRoute,
});

function LoginRoute() {
  const {redirect} = Route.useSearch();
  return <LoginPage redirect={redirect} />;
}
