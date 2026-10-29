import {errorMessage} from '@qgames/api';
import {useGetGame} from '@qgames/api/portal';
import {Button} from '@qgames/ui/components/Button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@qgames/ui/components/Dialog';
import {PageLayout} from '@qgames/ui/components/PageLayout';

import {playersLabel, type GameEntry} from '@/entities/game';
import {CreateRoomButton} from '@/features/createRoom';

import {testIds} from './GameRoomsPage.testIds';

export interface GameRoomsPageProps {
  game: GameEntry;
  /** Пользователя только что исключили из комнаты этой игры. */
  kicked: boolean;
  /** Окно об исключении закрыто. */
  onKickedClose: () => void;
}

/** Карточка игры: описание, число игроков и создание комнаты. */
export function GameRoomsPage({
  game,
  kicked,
  onKickedClose,
}: GameRoomsPageProps) {
  // Маршрут загружает игру заранее, поэтому ожидание здесь — только при сбое кеша.
  const {data, error, isPending} = useGetGame(game.code);
  const pageData = {
    'data-testid': testIds.root,
    'data-game-code': game.code,
  };

  if (isPending) {
    return (
      <PageLayout {...pageData} title="Игра">
        <p className="text-muted-foreground">Загружаем игру…</p>
      </PageLayout>
    );
  }
  if (error !== null) {
    return (
      <PageLayout {...pageData} title="Игра">
        <p className="text-destructive" role="alert">
          {errorMessage(error, {GAME_NOT_FOUND: 'Игра недоступна.'})}
        </p>
      </PageLayout>
    );
  }

  const {rules} = data;
  return (
    <PageLayout
      {...pageData}
      title={data.title}
      description={data.description}
      actions={<CreateRoomButton game={game} />}
    >
      <p className="text-sm">
        {playersLabel(rules.minPlayers, rules.maxPlayers)}
      </p>
      <p className="text-muted-foreground">
        Список публичных комнат этой игры пока не реализован.
      </p>
      <KickedDialog open={kicked} onClose={onKickedClose} />
    </PageLayout>
  );
}

interface KickedDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Причина, по которой пользователь оказался на странице игры. */
function KickedDialog({open, onClose}: KickedDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={value => {
        if (!value) {
          onClose();
        }
      }}
    >
      <DialogContent data-testid={testIds.kickedDialog}>
        <DialogHeader>
          <DialogTitle>Вас исключили из комнаты</DialogTitle>
          <DialogDescription>
            Владелец комнаты исключил вас. Это не блокировка: войти снова можно
            по ссылке на комнату.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">Понятно</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
