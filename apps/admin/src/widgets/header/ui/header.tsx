import {Link} from '@tanstack/react-router';

import {useCurrentAdmin} from '@/entities/admin';
import {LogoutButton} from '@/features/logout';

import {testIds} from './header.test-ids';

const NAV_LINK_CLASS =
  'rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground data-[status=active]:bg-muted data-[status=active]:text-foreground';

/** Шапка админки: разделы и выход видны только после входа. */
export function Header() {
  const current = useCurrentAdmin();

  return (
    <header className="border-b" data-testid={testIds.root}>
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
        <Link
          to="/"
          className="text-lg font-bold"
          data-testid={testIds.homeLink}
        >
          qgames · админка
        </Link>
        {current.status === 'admin' ? (
          <>
            <nav className="flex gap-1">
              <Link
                to="/admins"
                className={NAV_LINK_CLASS}
                data-testid={testIds.adminsLink}
              >
                Администраторы
              </Link>
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <span
                className="max-w-40 truncate text-sm font-medium"
                data-testid={testIds.currentAdmin}
                data-login={current.admin.login}
              >
                {current.admin.login}
              </span>
              <LogoutButton />
            </div>
          </>
        ) : null}
      </div>
    </header>
  );
}
