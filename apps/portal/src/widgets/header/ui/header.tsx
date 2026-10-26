import {Button} from '@qgames/ui/components/button';
import {Link} from '@tanstack/react-router';
import {useState} from 'react';

import {CurrentUser, useViewer} from '@/entities/user';
import {AuthDialog} from '@/features/auth';
import {LogoutButton} from '@/features/logout';

const NAV_LINK_CLASS =
  'rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground data-[status=active]:bg-muted data-[status=active]:text-foreground';

export function Header() {
  const viewer = useViewer();
  const [authOpen, setAuthOpen] = useState(false);

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
              <Link
                to="/profile"
                className="rounded-md px-2 py-1 hover:bg-muted"
                title="Профиль"
              >
                <CurrentUser viewer={viewer.viewer} />
              </Link>
              <LogoutButton />
            </>
          ) : null}
          {viewer.status === 'guest' ? (
            <>
              <Button
                size="sm"
                onClick={() => {
                  setAuthOpen(true);
                }}
              >
                Войти
              </Button>
              <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
