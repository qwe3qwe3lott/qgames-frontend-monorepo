import {isApiError} from '@qgames/api';
import {useGetGame, useGetRoom} from '@qgames/api/gateway';

import type {GameEntry} from '@/entities/game';
import {membership, roomErrorMessage, toRoomView} from '@/entities/room';
import {useRoomPresence} from '@/features/room-membership';
import {PageLayout} from '@/shared/ui';
import {GameBoard} from '@/widgets/game-board';
import {RoomPanel} from '@/widgets/room-panel';

/**
 * Комнату обновляет поток событий; состояние идущей партии в нём пока не
 * приходит, поэтому во время партии комната перечитывается опросом (CLAUDE.md §4).
 */
const SESSION_POLL_INTERVAL_MS = 2000;

/** Заголовок, пока название игры не загружено или игра недоступна. */
const FALLBACK_TITLE = 'Комната';

/** Ответ 4xx окончательный (комнаты нет, нет доступа): поток не открываем. */
function isFinalError(error: unknown): boolean {
  return isApiError(error) && error.status >= 400 && error.status < 500;
}

export interface RoomPageProps {
  game: GameEntry;
  roomId: string;
  viewerId: string;
}

export function RoomPage({game, roomId, viewerId}: RoomPageProps) {
  const {data, dataUpdatedAt, error, isPending} = useGetRoom(roomId, {
    query: {
      refetchInterval: query =>
        query.state.data?.status === 'IN_GAME'
          ? SESSION_POLL_INTERVAL_MS
          : false,
    },
  });
  // Название игры приходит с бэкенда; маршрут комнаты загружает его заранее.
  const title = useGetGame(game.code).data?.title ?? FALLBACK_TITLE;
  // Пока страница открыта и комната доступна, пользователь в ней.
  const presence = useRoomPresence(roomId, !isFinalError(error));

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
      {presence.status === 'reconnecting' ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          Нет связи с комнатой — переподключаемся…
        </p>
      ) : null}
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
