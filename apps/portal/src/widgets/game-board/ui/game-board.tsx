import {Component, Suspense, use, type ReactNode} from 'react';

import {
  loadGameModule,
  type GameBoardPlayer,
  type GameInfo,
  type GameModule,
} from '@/entities/game';
import {memberName, type RoomView, type SessionView} from '@/entities/room';
import {useMoveControls} from '@/features/make-move';

export interface GameBoardProps {
  game: GameInfo;
  room: RoomView;
  viewerId: string;
}

/** Ошибка загрузки чанка игры не должна ронять страницу комнаты. */
class ChunkErrorBoundary extends Component<
  {children: ReactNode},
  {failed: boolean}
> {
  override state = {failed: false};

  static getDerivedStateFromError(): {failed: boolean} {
    return {failed: true};
  }

  override render(): ReactNode {
    if (this.state.failed) {
      return (
        <p className="text-destructive">
          Не удалось загрузить игру. Обновите страницу.
        </p>
      );
    }
    return this.props.children;
  }
}

function Board({
  modulePromise,
  room,
  session,
  viewerId,
}: {
  modulePromise: Promise<GameModule>;
  room: RoomView;
  session: SessionView;
  viewerId: string;
}) {
  const module = use(modulePromise);
  const controls = useMoveControls(room);
  const players: GameBoardPlayer[] = room.members.map(member => ({
    id: member.userId,
    name: memberName(member),
    avatar: member.avatar,
  }));
  return (
    <module.Board
      session={session}
      players={players}
      viewerId={viewerId}
      {...controls}
    />
  );
}

/** Доска игры из отдельного чанка; без партии — подсказка, что делать. */
export function GameBoard({game, room, viewerId}: GameBoardProps) {
  const modulePromise = loadGameModule(game.code);
  if (modulePromise === null) {
    return <p className="text-muted-foreground">Игра ещё в разработке.</p>;
  }
  const {session} = room;
  if (session === null) {
    return (
      <p className="text-muted-foreground">
        Партия ещё не начиналась. Владелец комнаты начнёт её, когда соберутся
        игроки.
      </p>
    );
  }
  return (
    <ChunkErrorBoundary>
      <Suspense
        fallback={<p className="text-muted-foreground">Загружаем игру…</p>}
      >
        <Board
          modulePromise={modulePromise}
          room={room}
          session={session}
          viewerId={viewerId}
        />
      </Suspense>
    </ChunkErrorBoundary>
  );
}
