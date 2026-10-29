import type {QueryClient} from '@tanstack/react-query';
import {createRootRouteWithContext, Outlet} from '@tanstack/react-router';

import {ErrorPage} from '@/pages/error';
import {NotFoundPage} from '@/pages/notFound';
import {Header} from '@/widgets/header';

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
  errorComponent: ({error, reset}) => (
    <ErrorPage error={error} onRetry={reset} />
  ),
});

function RootLayout() {
  return (
    <div className="min-h-screen">
      <Header />
      <Outlet />
    </div>
  );
}
