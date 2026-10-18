import {isApiError} from '@qgames/api';
import {getGetRoomQueryOptions} from '@qgames/api/gateway';
import {createFileRoute, notFound} from '@tanstack/react-router';
import {z} from 'zod';

import {gameByType} from '@/entities/game';
import {RoomPage} from '@/pages/room';

const roomIdSchema = z.uuid();

export const Route = createFileRoute('/games/$gameCode/rooms/$roomId')({
  beforeLoad: ({params}) => {
    if (!roomIdSchema.safeParse(params.roomId).success) {
      throw notFound();
    }
  },
  loader: async ({context, params}) => {
    try {
      // Из кеша, если комната уже загружена (например, сразу после создания).
      const room = await context.queryClient.query({
        ...getGetRoomQueryOptions(params.roomId),
        staleTime: 'static',
      });
      // Комната другой игры по этой ссылке не открывается.
      if (gameByType(room.gameType)?.code !== context.game.code) {
        throw notFound();
      }
    } catch (error) {
      if (isApiError(error) && error.code === 'ROOM_NOT_FOUND') {
        throw notFound();
      }
      throw error;
    }
  },
  component: RoomRoute,
});

function RoomRoute() {
  const {game, viewer} = Route.useRouteContext();
  const {roomId} = Route.useParams();
  return <RoomPage game={game} roomId={roomId} viewerId={viewer.id} />;
}
