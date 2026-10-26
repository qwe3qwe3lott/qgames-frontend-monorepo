import {createFileRoute, notFound} from '@tanstack/react-router';

import {gameByCode, isGameCode} from '@/entities/game';

/** Все маршруты игры: неизвестный код → 404. Вход проверяет авторизованная зона (ручки комнат требуют входа). */
export const Route = createFileRoute('/_authenticated/games/$gameCode')({
  beforeLoad: ({params}) => {
    if (!isGameCode(params.gameCode)) {
      throw notFound();
    }
    return {game: gameByCode(params.gameCode)};
  },
});
