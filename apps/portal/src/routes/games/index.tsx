import {createFileRoute} from '@tanstack/react-router';

import {GamesPage} from '@/pages/games';

export const Route = createFileRoute('/games/')({
  component: GamesPage,
});
