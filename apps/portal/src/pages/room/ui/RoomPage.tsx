import {isApiError} from '@qgames/api';
import {useGetGame, useGetRoom} from '@qgames/api/portal';
import {PageLayout} from '@qgames/ui/components/PageLayout';
import {useState} from 'react';

import type {GameEntry} from '@/entities/game';
import {
  membership,
  roomErrorMessage,
  toRoomView,
  useRoomStream,
} from '@/entities/room';
import {useRoomPresence} from '@/features/roomMembership';
import {GameBoard} from '@/widgets/gameBoard';
import {RoomPanel} from '@/widgets/roomPanel';

import {testIds} from './RoomPage.testIds';

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
  // Комнату строит её поток (снапшот, затем патчи по seq), партию — поток
  // партии; опроса нет. GET комнаты (его уже загрузил маршрут) комнату не
  // показывает: он нужен для ошибок и перечитывается только после закрытия
  // потока сервером (invalidateRoom), поэтому сам не устаревает.
  const probe = useGetRoom(roomId, {query: {staleTime: Infinity}});
  // Название игры приходит с бэкенда; маршрут комнаты загружает его заранее.
  const title = useGetGame(game.code).data?.title ?? FALLBACK_TITLE;
  // Сервер не впустил: мест нет (NO_SPECTATOR_SEAT). Отказ окончательный —
  // поток больше не открывается, войти можно перезагрузкой страницы.
  const [refused, setRefused] = useState(false);
  // Пока страница открыта и комната доступна, пользователь в ней.
  const presence = useRoomPresence(
    roomId,
    !isFinalError(probe.error) && !refused,
  );
  const stream = useRoomStream(roomId);
  const pageData = {'data-testid': testIds.root, 'data-room-id': roomId};

  // Сбой перечитывания (сеть, 5xx — например, перезапуск бэкенда) не заменяет
  // уже построенную комнату: поток переподключается, страница показывает
  // «переподключаемся». Окончательный ответ (4xx) показывается всегда.
  if (
    probe.error !== null &&
    (isFinalError(probe.error) || stream === undefined)
  ) {
    return (
      <PageLayout {...pageData} title={title}>
        <p className="text-destructive" role="alert">
          {roomErrorMessage(probe.error)}
        </p>
      </PageLayout>
    );
  }
  // EventSource не видит кода ответа: отказ во входе узнаётся по перечитанной
  // комнате — пользователь не вошёл, а места для него нет. Только пока поток
  // не отдал снапшот: вошедшего обрыв связи просто переподключает.
  if (!refused && stream === undefined && probe.data !== undefined) {
    const probed = membership(toRoomView(probe.data), viewerId);
    const full = probed.member === null && !probed.canJoin;
    if (full && presence.status === 'reconnecting') {
      setRefused(true);
    }
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
  if (stream === undefined) {
    return (
      <PageLayout {...pageData} title={title}>
        <p className="text-muted-foreground">Загружаем комнату…</p>
      </PageLayout>
    );
  }
  const room = toRoomView(stream.room);
  const viewerMembership = membership(room, viewerId);

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
