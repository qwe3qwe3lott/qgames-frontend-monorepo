import {Button} from '@qgames/ui/components/button';
import {Link} from '@tanstack/react-router';

import {CurrentUser, useViewer} from '@/entities/user';
import {LogoutButton} from '@/features/logout';

const NAV_LINK_CLASS =
  'rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground data-[status=active]:bg-muted data-[status=active]:text-foreground';

export function Header() {
  const viewer = useViewer();

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
        <Link to="/" className="text-lg font-bold">
          qgames
        </Link>
        <nav className="flex gap-1">
          <Link to="/games" className={NAV_LINK_CLASS}>
            Игры
          </Link>
          <Link to="/rooms" className={NAV_LINK_CLASS}>
            Комнаты
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {viewer.status === 'user' ? (
            <>
              <CurrentUser viewer={viewer.viewer} />
              <LogoutButton />
            </>
          ) : null}
          {viewer.status === 'guest' ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login" search={{redirect: undefined}}>
                  Войти
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/register" search={{redirect: undefined}}>
                  Регистрация
                </Link>
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
