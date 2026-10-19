import {createFileRoute} from '@tanstack/react-router';

import {requireUser} from '@/entities/user';
import {ProfilePage} from '@/pages/profile';

export const Route = createFileRoute('/profile')({
  beforeLoad: async ({context, location}) => {
    await requireUser(context.queryClient, location);
  },
  component: ProfilePage,
});
