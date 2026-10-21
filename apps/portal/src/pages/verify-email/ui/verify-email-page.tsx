import {PageLayout} from '@qgames/ui/components/page-layout';

import {VerifyEmailForm} from '@/features/verify-email';

export interface VerifyEmailPageProps {
  email: string;
  redirect: string | undefined;
}

export function VerifyEmailPage({email, redirect}: VerifyEmailPageProps) {
  return (
    <PageLayout
      title="Подтверждение email"
      description="Введите 6-значный код из письма. Код действует 15 минут."
    >
      <div className="max-w-sm">
        <VerifyEmailForm email={email} redirect={redirect} />
      </div>
    </PageLayout>
  );
}
