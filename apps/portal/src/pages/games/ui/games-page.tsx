import {errorMessage} from '@qgames/api';
import {useListGames} from '@qgames/api/portal';
import type {GameSummaryDto} from '@qgames/api/portal/model';
import {Button} from '@qgames/ui/components/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@qgames/ui/components/card';
import {PageLayout} from '@qgames/ui/components/page-layout';
import {Link} from '@tanstack/react-router';

import {testIds} from './games-page.test-ids';

/** Карточка игры каталога со ссылкой на создание комнаты. */
function GameCard({game}: {game: GameSummaryDto}) {
  return (
    <li>
      <Link
        to="/games/$gameCode/rooms"
        params={{gameCode: game.code}}
        className="block h-full rounded-xl"
        data-testid={testIds.gameCard}
        data-game-code={game.code}
      >
        <Card className="h-full transition-colors hover:border-foreground/30">
          <CardHeader>
            <CardTitle>{game.title}</CardTitle>
            <CardDescription>{game.description}</CardDescription>
          </CardHeader>
        </Card>
      </Link>
    </li>
  );
}

/** Каталог игр из `GET /api/games`, доступен и гостям. */
export function GamesPage() {
  const {data, error, isPending, isFetching, refetch} = useListGames();

  if (isPending) {
    return (
      <PageLayout data-testid={testIds.root} title="Игры">
        <p className="text-muted-foreground">Загружаем игры…</p>
      </PageLayout>
    );
  }
  if (error !== null) {
    return (
      <PageLayout data-testid={testIds.root} title="Игры">
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
      data-testid={testIds.root}
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
