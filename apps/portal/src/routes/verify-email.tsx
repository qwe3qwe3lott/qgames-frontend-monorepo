import {createFileRoute} from '@tanstack/react-router';
import {z} from 'zod';

import {VerifyEmailPage} from '@/pages/verify-email';

import {redirectSchema} from './-search';

const verifyEmailSearchSchema = z.object({
  email: z.email(),
  redirect: redirectSchema,
});

export const Route = createFileRoute('/verify-email')({
  validateSearch: verifyEmailSearchSchema,
  component: VerifyEmailRoute,
});

function VerifyEmailRoute() {
  const {email, redirect} = Route.useSearch();
  return <VerifyEmailPage email={email} redirect={redirect} />;
}
