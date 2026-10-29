import {isApiError} from '@qgames/api';
import {getGetGameQueryOptions} from '@qgames/api/portal';
import {createFileRoute, notFound} from '@tanstack/react-router';
import {z} from 'zod';

import {GameRoomsPage} from '@/pages/gameRooms';

/** `kicked` — сюда увели исключённого из комнаты: страница показывает причину. */
const searchSchema = z.object({kicked: z.boolean().optional()});

export const Route = createFileRoute('/_authenticated/games/$gameCode/rooms/')({
  validateSearch: searchSchema,
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
  const {kicked = false} = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <GameRoomsPage
      game={game}
      kicked={kicked}
      onKickedClose={() => {
        void navigate({search: {}, replace: true});
      }}
    />
  );
}
