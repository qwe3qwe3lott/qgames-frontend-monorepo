import {useGetGame, useGetRoom} from '@qgames/api/gateway';
import {Button} from '@qgames/ui/components/button';

import type {GameEntry} from '@/entities/game';
import {membership, roomErrorMessage, toRoomView} from '@/entities/room';
import {useRoomPresence} from '@/features/room-membership';
import {PageLayout} from '@/shared/ui';
import {GameBoard} from '@/widgets/game-board';
import {RoomPanel} from '@/widgets/room-panel';

/** Пока нет SSE, комната перечитывается опросом (CLAUDE.md §4). */
const ROOM_POLL_INTERVAL_MS = 2000;

/** Заголовок, пока название игры не загружено или игра недоступна. */
const FALLBACK_TITLE = 'Комната';

export interface RoomPageProps {
  game: GameEntry;
  roomId: string;
  viewerId: string;
}

export function RoomPage({game, roomId, viewerId}: RoomPageProps) {
  const {data, dataUpdatedAt, error, isPending} = useGetRoom(roomId, {
    query: {refetchInterval: ROOM_POLL_INTERVAL_MS},
  });
  // Название игры приходит с бэкенда; маршрут комнаты загружает его заранее.
  const title = useGetGame(game.code).data?.title ?? FALLBACK_TITLE;
  // Пока страница открыта, пользователь — участник комнаты и не уходящий.
  const viewer = data?.members.find(m => m.userId === viewerId);
  const presence = useRoomPresence(
    roomId,
    data === undefined ? null : viewer === undefined || viewer.leaving,
  );

  if (isPending) {
    return (
      <PageLayout title={title}>
        <p className="text-muted-foreground">Загружаем комнату…</p>
      </PageLayout>
    );
  }
  if (error !== null) {
    return (
      <PageLayout title={title}>
        <p className="text-destructive" role="alert">
          {roomErrorMessage(error)}
        </p>
      </PageLayout>
    );
  }
  const room = toRoomView(data, dataUpdatedAt);
  const viewerMembership = membership(room, viewerId);

  return (
    <PageLayout
      title={title}
      description="Отправьте ссылку на эту страницу друзьям, чтобы они вошли в комнату."
    >
      {presence.joinError === null ? null : (
        <div className="mb-4 flex flex-wrap items-center gap-3" role="alert">
          <p className="text-sm text-destructive">
            Не удалось войти в комнату. {roomErrorMessage(presence.joinError)}
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={presence.joinPending}
            onClick={presence.retryJoin}
          >
            Повторить
          </Button>
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-[20rem_1fr]">
        <RoomPanel
          gameTitle={title}
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
