import {useGetRoom} from '@qgames/api/gateway';

import type {GameInfo} from '@/entities/game';
import {membership, roomErrorMessage, toRoomView} from '@/entities/room';
import {PageLayout} from '@/shared/ui';
import {GameBoard} from '@/widgets/game-board';
import {RoomPanel} from '@/widgets/room-panel';

/** Пока нет SSE, комната перечитывается опросом (CLAUDE.md §4). */
const ROOM_POLL_INTERVAL_MS = 2000;

export interface RoomPageProps {
  game: GameInfo;
  roomId: string;
  viewerId: string;
}

export function RoomPage({game, roomId, viewerId}: RoomPageProps) {
  const {data, error, isPending} = useGetRoom(roomId, {
    query: {refetchInterval: ROOM_POLL_INTERVAL_MS},
  });

  if (isPending) {
    return (
      <PageLayout title={game.title}>
        <p className="text-muted-foreground">Загружаем комнату…</p>
      </PageLayout>
    );
  }
  if (error !== null) {
    return (
      <PageLayout title={game.title}>
        <p className="text-destructive" role="alert">
          {roomErrorMessage(error)}
        </p>
      </PageLayout>
    );
  }
  const room = toRoomView(data);
  const viewerMembership = membership(room, viewerId);

  return (
    <PageLayout
      title={game.title}
      description="Отправьте ссылку на эту страницу друзьям, чтобы они вошли в комнату."
    >
      <div className="grid gap-6 md:grid-cols-[20rem_1fr]">
        <RoomPanel
          game={game}
          room={room}
          membership={viewerMembership}
          viewerId={viewerId}
        />
        <section className="flex flex-col gap-4 rounded-lg border p-6">
          <GameBoard game={game} room={room} viewerId={viewerId} />
        </section>
      </div>
    </PageLayout>
  );
}
