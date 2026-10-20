import {createFileRoute} from '@tanstack/react-router';

import {requireAdmin} from '@/entities/admin';
import {AdminsPage} from '@/pages/admins';

export const Route = createFileRoute('/admins')({
  beforeLoad: async ({context, location}) => {
    await requireAdmin(context.queryClient, location);
  },
  component: AdminsPage,
});
