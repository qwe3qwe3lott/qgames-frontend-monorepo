import {errorMessage} from '@qgames/api';
import {useGetCurrentUser} from '@qgames/api/portal';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@qgames/ui/components/card';
import {PageLayout} from '@qgames/ui/components/page-layout';

import {ChangePasswordDialog} from '@/features/change-password';
import {LinkGoogleButton} from '@/features/link-google';
import {SetPasswordDialog} from '@/features/set-password';
import {UpdateProfileForm} from '@/features/update-profile';

export function ProfilePage() {
  const {data: user, error, isPending} = useGetCurrentUser();

  if (isPending) {
    return (
      <PageLayout title="Профиль">
        <p className="text-muted-foreground">Загружаем профиль…</p>
      </PageLayout>
    );
  }
  if (error !== null) {
    return (
      <PageLayout title="Профиль">
        <p className="text-destructive" role="alert">
          {errorMessage(error)}
        </p>
      </PageLayout>
    );
  }
  const hasPassword = user.loginMethods.includes('PASSWORD');
  const hasGoogle = user.loginMethods.includes('GOOGLE');

  return (
    <PageLayout title="Профиль" description={user.email}>
      <div className="grid max-w-2xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ник и аватар</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {hasPassword ? null : (
              <p className="text-sm text-muted-foreground">
                Ник при входе через Google выбран случайно — его можно поменять.
              </p>
            )}
            <UpdateProfileForm
              defaults={{nickname: user.nickname, avatar: user.avatar}}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Способы входа</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <section className="flex flex-col gap-2">
              <h2 className="font-medium">Вход по паролю</h2>
              {hasPassword ? (
                <>
                  <p className="text-sm text-muted-foreground">Подключён</p>
                  <ChangePasswordDialog />
                </>
              ) : (
                <SetPasswordDialog />
              )}
            </section>
            <section className="flex flex-col gap-2">
              <h2 className="font-medium">Google</h2>
              {hasGoogle ? (
                <p className="text-sm text-muted-foreground">Подключён</p>
              ) : (
                <LinkGoogleButton />
              )}
            </section>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
