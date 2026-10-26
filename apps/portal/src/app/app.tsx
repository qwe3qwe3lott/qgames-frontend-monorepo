import {Toaster} from '@qgames/ui/components/sonner';
import {ThemeProvider} from '@qgames/ui/components/theme-provider';
import {TooltipProvider} from '@qgames/ui/components/tooltip';
import {QueryClientProvider} from '@tanstack/react-query';
import {RouterProvider} from '@tanstack/react-router';

import {queryClient, router} from './router';

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <RouterProvider router={router} />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
