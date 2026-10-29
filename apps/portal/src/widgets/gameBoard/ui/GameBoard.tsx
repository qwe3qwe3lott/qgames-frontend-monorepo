import {Suspense, use} from 'react';

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

import {ChunkErrorBoundary} from './ChunkErrorBoundary';

export interface GameBoardProps {
  game: GameEntry;
  room: RoomView;
  viewerId: string;
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
    viewerId,
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
      {status === 'denied' ? (
        <p className="text-sm text-destructive" role="alert">
          Партия недоступна: её уже нет или вы больше не участник комнаты.
          Обновите страницу, чтобы попробовать снова.
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
    <ChunkErrorBoundary
      fallback={
        <p className="text-destructive">
          Не удалось загрузить игру. Обновите страницу.
        </p>
      }
    >
      <Suspense
        fallback={<p className="text-muted-foreground">Загружаем игру…</p>}
      >
        <Board load={load} room={room} session={session} viewerId={viewerId} />
      </Suspense>
    </ChunkErrorBoundary>
  );
}
