import {createFileRoute} from '@tanstack/react-router';

import {RegisterPage} from '@/pages/register';

import {authSearchSchema} from './-search';

export const Route = createFileRoute('/register')({
  validateSearch: authSearchSchema,
  component: RegisterRoute,
});

function RegisterRoute() {
  const {redirect} = Route.useSearch();
  return <RegisterPage redirect={redirect} />;
}
