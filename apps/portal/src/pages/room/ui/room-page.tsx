import {isApiError} from '@qgames/api';
import {useGetGame, useGetRoom} from '@qgames/api/portal';
import {PageLayout} from '@qgames/ui/components/page-layout';
import {useState} from 'react';

import type {GameEntry} from '@/entities/game';
import {membership, roomErrorMessage, toRoomView} from '@/entities/room';
import {useRoomPresence} from '@/features/room-membership';
import {GameBoard} from '@/widgets/game-board';
import {RoomPanel} from '@/widgets/room-panel';

import {testIds} from './room-page.test-ids';

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
  // Комнату обновляет её поток событий, партию — поток партии; опроса нет.
  // Комнату уже загрузил маршрут, а фоновый перезапрос при монтировании мог
  // завершиться после снапшота потока и затереть его (вошедший не видел себя),
  // поэтому данные не устаревают сами; invalidateRoom перезапрашивает их явно.
  const {data, error, isPending} = useGetRoom(roomId, {
    query: {staleTime: Infinity},
  });
  // Название игры приходит с бэкенда; маршрут комнаты загружает его заранее.
  const title = useGetGame(game.code).data?.title ?? FALLBACK_TITLE;
  // Сервер не впустил: мест нет (NO_SPECTATOR_SEAT). Отказ окончательный —
  // поток больше не открывается, войти можно перезагрузкой страницы.
  const [refused, setRefused] = useState(false);
  // Пока страница открыта и комната доступна, пользователь в ней.
  const presence = useRoomPresence(roomId, !isFinalError(error) && !refused);
  const pageData = {'data-testid': testIds.root, 'data-room-id': roomId};

  if (isPending) {
    return (
      <PageLayout {...pageData} title={title}>
        <p className="text-muted-foreground">Загружаем комнату…</p>
      </PageLayout>
    );
  }
  if (error !== null) {
    return (
      <PageLayout {...pageData} title={title}>
        <p className="text-destructive" role="alert">
          {roomErrorMessage(error)}
        </p>
      </PageLayout>
    );
  }
  const room = toRoomView(data);
  const viewerMembership = membership(room, viewerId);
  // EventSource не видит кода ответа: отказ во входе узнаётся по перечитанной
  // комнате — пользователь не вошёл, а места для него нет.
  const full = viewerMembership.member === null && !viewerMembership.canJoin;
  if (!refused && full && presence.status === 'reconnecting') {
    setRefused(true);
  }
  if (refused) {
    return (
      <PageLayout {...pageData} title={title}>
        <p className="text-destructive" role="alert">
          В комнате нет свободных мест: игроки и наблюдатели заняли все места.
          Обновите страницу, чтобы попробовать войти снова.
        </p>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      {...pageData}
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
