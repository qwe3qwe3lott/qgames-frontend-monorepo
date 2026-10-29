import {Toaster} from '@qgames/ui/components/Sonner';
import {ThemeProvider} from '@qgames/ui/components/ThemeProvider';
import {QueryClientProvider} from '@tanstack/react-query';
import {RouterProvider} from '@tanstack/react-router';

import {queryClient, router} from './router';

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
