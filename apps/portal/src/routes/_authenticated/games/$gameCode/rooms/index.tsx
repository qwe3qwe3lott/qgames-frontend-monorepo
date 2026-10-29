import {isApiError} from '@qgames/api';
import {getGetGameQueryOptions} from '@qgames/api/portal';
import {createFileRoute, notFound} from '@tanstack/react-router';

import {GameRoomsPage} from '@/pages/gameRooms';

export const Route = createFileRoute('/_authenticated/games/$gameCode/rooms/')({
  loader: async ({context}) => {
    try {
      // Из кеша, если игра уже загружена; страница перечитает её при открытии.
      await context.queryClient.query({
        ...getGetGameQueryOptions(context.game.code),
        staleTime: 'static',
      });
    } catch (error) {
      // Игра не опубликована или принудительно отключена — для портала её нет.
      if (isApiError(error) && error.code === 'GAME_NOT_FOUND') {
        throw notFound();
      }
      throw error;
    }
  },
  component: GameRoomsRoute,
});

function GameRoomsRoute() {
  const {game} = Route.useRouteContext();
  return <GameRoomsPage game={game} />;
}
