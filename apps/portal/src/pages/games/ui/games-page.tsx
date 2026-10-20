import {useListGames} from '@qgames/api/gateway';
import type {GameSummaryDto} from '@qgames/api/gateway/model';
import {Button} from '@qgames/ui/components/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@qgames/ui/components/card';
import {cn} from '@qgames/ui/lib/utils';
import {Link} from '@tanstack/react-router';

import {errorMessage} from '@/shared/lib';
import {PageLayout} from '@/shared/ui';

/** DISABLED-игра бледная, с пометкой и без перехода к созданию комнаты. */
function GameCard({game}: {game: GameSummaryDto}) {
  const disabled = game.publishStatus === 'DISABLED';
  const content = (
    <Card
      className={cn(
        'h-full transition-colors',
        disabled ? 'opacity-60' : 'hover:border-foreground/30',
      )}
    >
      <CardHeader>
        <CardTitle>{game.title}</CardTitle>
        <CardDescription>{game.description}</CardDescription>
        {disabled ? (
          <p className="text-sm font-medium text-muted-foreground">
            Временно недоступна
          </p>
        ) : null}
      </CardHeader>
    </Card>
  );
  if (disabled) {
    return <li>{content}</li>;
  }
  return (
    <li>
      <Link
        to="/games/$gameCode/rooms"
        params={{gameCode: game.code}}
        className="block h-full rounded-xl"
      >
        {content}
      </Link>
    </li>
  );
}

/** Каталог игр из `GET /api/games`, доступен и гостям. */
export function GamesPage() {
  const {data, error, isPending, isFetching, refetch} = useListGames();

  if (isPending) {
    return (
      <PageLayout title="Игры">
        <p className="text-muted-foreground">Загружаем игры…</p>
      </PageLayout>
    );
  }
  if (error !== null) {
    return (
      <PageLayout title="Игры">
        <div className="flex flex-col items-start gap-3" role="alert">
          <p className="text-destructive">{errorMessage(error)}</p>
          <Button
            variant="outline"
            disabled={isFetching}
            onClick={() => {
              void refetch();
            }}
          >
            Повторить
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Игры"
      description="Выберите игру, чтобы создать комнату."
    >
      {data.games.length === 0 ? (
        <p className="text-muted-foreground">Игр пока нет.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {data.games.map(game => (
            <GameCard key={game.code} game={game} />
          ))}
        </ul>
      )}
    </PageLayout>
  );
}
