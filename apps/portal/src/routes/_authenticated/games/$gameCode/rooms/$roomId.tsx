import {isApiError} from '@qgames/api';
import {
  getGetGameQueryOptions,
  getGetRoomQueryOptions,
} from '@qgames/api/portal';
import {createFileRoute, notFound} from '@tanstack/react-router';
import {z} from 'zod';

import {RoomPage} from '@/pages/room';

const roomIdSchema = z.uuid();

export const Route = createFileRoute(
  '/_authenticated/games/$gameCode/rooms/$roomId',
)({
  beforeLoad: ({params}) => {
    if (!roomIdSchema.safeParse(params.roomId).success) {
      throw notFound();
    }
  },
  loader: async ({context, params}) => {
    const {queryClient, game} = context;
    // Название игры для заголовка; ошибку (игра недоступна) покажет страница.
    const gameDetails = queryClient
      .query(getGetGameQueryOptions(game.code))
      .catch(() => undefined);
    try {
      // Из кеша, если комната уже загружена (например, сразу после создания).
      const room = await queryClient.query({
        ...getGetRoomQueryOptions(params.roomId),
        staleTime: 'static',
      });
      // Комната другой игры по этой ссылке не открывается.
      if (room.gameCode !== game.code) {
        throw notFound();
      }
    } catch (error) {
      if (isApiError(error) && error.code === 'ROOM_NOT_FOUND') {
        throw notFound();
      }
      // Игра комнаты не опубликована или отключена: страница покажет «Игра недоступна».
      if (!(isApiError(error) && error.code === 'GAME_NOT_FOUND')) {
        throw error;
      }
    }
    await gameDetails;
  },
  component: RoomRoute,
});

function RoomRoute() {
  const {game, viewer} = Route.useRouteContext();
  const {roomId} = Route.useParams();
  return <RoomPage game={game} roomId={roomId} viewerId={viewer.id} />;
}
