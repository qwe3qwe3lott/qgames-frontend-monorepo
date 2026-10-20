import {useGetGame} from '@qgames/api/gateway';

import {
  GAME_UNAVAILABLE_HINT,
  playersLabel,
  type GameEntry,
} from '@/entities/game';
import {CreateRoomDialog} from '@/features/create-room';
import {errorMessage} from '@/shared/lib';
import {PageLayout} from '@/shared/ui';

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
      actions={<CreateRoomDialog game={game} details={data} />}
    >
      <p className="text-sm">
        {playersLabel(rules.minPlayers, rules.maxPlayers)}
      </p>
      {data.publishStatus === 'DISABLED' ? (
        <p className="text-sm text-muted-foreground">
          {GAME_UNAVAILABLE_HINT}: новые комнаты создать нельзя, идущие партии
          продолжаются.
        </p>
      ) : null}
      <p className="text-muted-foreground">
        Список публичных комнат этой игры пока не реализован.
      </p>
    </PageLayout>
  );
}
