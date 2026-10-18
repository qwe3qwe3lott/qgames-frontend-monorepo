import {createFileRoute} from '@tanstack/react-router';

import {GameRoomsPage} from '@/pages/game-rooms';

export const Route = createFileRoute('/games/$gameCode/rooms/')({
  component: GameRoomsRoute,
});

function GameRoomsRoute() {
  const {game} = Route.useRouteContext();
  return <GameRoomsPage game={game} />;
}
