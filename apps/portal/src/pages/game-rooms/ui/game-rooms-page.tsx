import {errorMessage} from '@qgames/api';
import {useGetGame} from '@qgames/api/portal';
import {PageLayout} from '@qgames/ui/components/page-layout';

import {playersLabel, type GameEntry} from '@/entities/game';
import {CreateRoomButton} from '@/features/create-room';

export interface GameRoomsPageProps {
  game: GameEntry;
}

/** Карточка игры: описание, число игроков и создание комнаты. */
export function GameRoomsPage({game}: GameRoomsPageProps) {
  // Маршрут загружает игру заранее, поэтому ожидание здесь — только при сбое кеша.
  const {data, error, isPending} = useGetGame(game.code);

  if (isPending) {
    return (
      <PageLayout title="Игра">
        <p className="text-muted-foreground">Загружаем игру…</p>
      </PageLayout>
    );
  }
  if (error !== null) {
    return (
      <PageLayout title="Игра">
        <p className="text-destructive" role="alert">
          {errorMessage(error, {GAME_NOT_FOUND: 'Игра недоступна.'})}
        </p>
      </PageLayout>
    );
  }

  const {rules} = data;
  return (
    <PageLayout
      title={data.title}
      description={data.description}
      actions={<CreateRoomButton game={game} />}
    >
      <p className="text-sm">
        {playersLabel(rules.minPlayers, rules.maxPlayers)}
      </p>
      <p className="text-muted-foreground">
        Список публичных комнат этой игры пока не реализован.
      </p>
    </PageLayout>
  );
}
