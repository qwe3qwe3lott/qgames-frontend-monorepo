import {createFileRoute, notFound} from '@tanstack/react-router';

import {gameByCode, isGameCode} from '@/entities/game';
import {requireUser} from '@/entities/user';

/** Все маршруты игры: неизвестный код → 404, гость → /login (ручки комнат требуют входа). */
export const Route = createFileRoute('/games/$gameCode')({
  beforeLoad: async ({params, context, location}) => {
    if (!isGameCode(params.gameCode)) {
      throw notFound();
    }
    const viewer = await requireUser(context.queryClient, location);
    return {game: gameByCode(params.gameCode), viewer};
  },
});
