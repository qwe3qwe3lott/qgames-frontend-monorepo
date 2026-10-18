import type {GameInfo} from '@/entities/game';
import {CreateRoomDialog} from '@/features/create-room';
import {PageLayout} from '@/shared/ui';

export interface GameRoomsPageProps {
  game: GameInfo;
}

export function GameRoomsPage({game}: GameRoomsPageProps) {
  return (
    <PageLayout
      title={game.title}
      description={game.description}
      actions={<CreateRoomDialog game={game} />}
    >
      <p className="text-muted-foreground">
        Список публичных комнат этой игры пока не реализован.
      </p>
    </PageLayout>
  );
}
