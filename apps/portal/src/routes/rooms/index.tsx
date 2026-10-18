import {createFileRoute} from '@tanstack/react-router';

import {RoomsPage} from '@/pages/rooms';

export const Route = createFileRoute('/rooms/')({
  component: RoomsPage,
});
