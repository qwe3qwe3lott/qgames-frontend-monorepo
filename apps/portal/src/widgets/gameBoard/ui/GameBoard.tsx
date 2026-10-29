import {Component, Suspense, use, type ReactNode} from 'react';

import {
  GAME_IN_DEVELOPMENT_HINT,
  loadGameModule,
  type GameBoardPlayer,
  type GameEntry,
  type GameLoader,
} from '@/entities/game';
import {memberName, type RoomView, type SessionView} from '@/entities/room';
import {useSession, useSessionEvents} from '@/entities/session';
import {useMoveControls} from '@/features/makeMove';

export interface GameBoardProps {
  game: GameEntry;
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
  load,
  room,
  session,
  viewerId,
}: {
  load: GameLoader;
  room: RoomView;
  session: SessionView;
  viewerId: string;
}) {
  const module = use(loadGameModule(room.gameCode, load));
  // Партия — только из потока: снапшот, затем события журнала (CLAUDE.md §4).
  const status = useSessionEvents({
    gameCode: room.gameCode,
    roomId: room.id,
    sessionId: session.id,
    rules: module,
  });
  const data = useSession(session.id);
  const controls = useMoveControls(room);
  const players: GameBoardPlayer[] = room.members.map(member => ({
    id: member.id,
    name: memberName(member),
    avatar: member.avatar,
  }));
  return (
    <>
      {status === 'reconnecting' ? (
        <p className="text-sm text-destructive" role="alert">
          Нет связи с партией — переподключаемся…
        </p>
      ) : null}
      {data === undefined ? (
        <p className="text-muted-foreground">Загружаем партию…</p>
      ) : (
        <module.Board
          session={data}
          players={players}
          viewerId={viewerId}
          {...controls}
        />
      )}
    </>
  );
}

/** Доска игры из отдельного чанка; без партии — подсказка, что делать. */
export function GameBoard({game, room, viewerId}: GameBoardProps) {
  const {load} = game;
  if (load === undefined) {
    return <p className="text-muted-foreground">{GAME_IN_DEVELOPMENT_HINT}.</p>;
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
        <Board load={load} room={room} session={session} viewerId={viewerId} />
      </Suspense>
    </ChunkErrorBoundary>
  );
}
