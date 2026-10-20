import {zodResolver} from '@hookform/resolvers/zod';
import {useCreateRoom, useGetGame} from '@qgames/api/gateway';
import type {GameInfoResponse} from '@qgames/api/gateway/model';
import {Button} from '@qgames/ui/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@qgames/ui/components/dialog';
import {FieldError, FieldGroup} from '@qgames/ui/components/field';
import {useQueryClient} from '@tanstack/react-query';
import {useNavigate} from '@tanstack/react-router';
import {useMemo} from 'react';
import {useForm} from 'react-hook-form';

import type {GameApi, GameInfo} from '@/entities/game';
import {
  ROOM_SETTINGS_FIELDS,
  roomErrorMessage,
  RoomSettingsFields,
  roomSettingsSchema,
  setRoomCache,
  toRoomSettings,
  toRoomSettingsValues,
  type RoomSettingsValues,
} from '@/entities/room';
import {applyFieldErrors} from '@/shared/lib';

export interface CreateRoomDialogProps {
  game: GameInfo;
}

/** Ошибки полей у создания комнаты приходят с префиксом тела запроса. */
const CREATE_FIELD_PREFIX = 'settings.';

interface CreateRoomFormProps {
  game: GameInfo;
  api: GameApi;
  info: GameInfoResponse;
}

function CreateRoomForm({game, api, info}: CreateRoomFormProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const schema = useMemo(() => roomSettingsSchema(info), [info]);
  const form = useForm<RoomSettingsValues>({
    resolver: zodResolver(schema),
    defaultValues: toRoomSettingsValues(info.defaultSettings, info),
  });
  const createRoom = useCreateRoom({
    mutation: {
      onSuccess: room => {
        setRoomCache(queryClient, room.id, room);
        void navigate({
          to: '/games/$gameCode/rooms/$roomId',
          params: {gameCode: game.code, roomId: room.id},
        });
      },
      onError: error => {
        if (
          !applyFieldErrors(error, form.setError, ROOM_SETTINGS_FIELDS, {
            prefix: CREATE_FIELD_PREFIX,
          })
        ) {
          form.setError('root', {message: roomErrorMessage(error)});
        }
      },
    },
  });

  return (
    <form
      noValidate
      onSubmit={event => {
        void form.handleSubmit(values => {
          createRoom.mutate({
            gameCode: api.gameCode,
            data: {settings: toRoomSettings(values)},
          });
        })(event);
      }}
    >
      <FieldGroup>
        <RoomSettingsFields form={form} info={info} idPrefix="create-room" />
        <FieldError errors={[form.formState.errors.root]} />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Отмена
            </Button>
          </DialogClose>
          <Button type="submit" disabled={createRoom.isPending}>
            Создать
          </Button>
        </DialogFooter>
      </FieldGroup>
    </form>
  );
}

/** Параметры игры (границы и значения по умолчанию) нужны форме до первого рендера. */
function CreateRoomContent({game, api}: {game: GameInfo; api: GameApi}) {
  const info = useGetGame(api.gameCode);
  if (info.isPending) {
    return (
      <p className="text-sm text-muted-foreground">Загружаем параметры игры…</p>
    );
  }
  if (info.isError) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {roomErrorMessage(info.error)}
      </p>
    );
  }
  return <CreateRoomForm game={game} api={api} info={info.data} />;
}

/** Создание комнаты с настройками игры: число раундов и правила времени. */
export function CreateRoomDialog({game}: CreateRoomDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Создать комнату</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новая комната: {game.title}</DialogTitle>
          <DialogDescription>{game.description}</DialogDescription>
        </DialogHeader>
        <p className="text-sm">
          {game.playersLabel}. Вы станете владельцем комнаты и первым игроком —
          отправьте ссылку на комнату друзьям.
        </p>
        {game.api === null ? (
          <p className="text-sm text-muted-foreground">
            Игра ещё в разработке — создать комнату пока нельзя.
          </p>
        ) : (
          <CreateRoomContent game={game} api={game.api} />
        )}
      </DialogContent>
    </Dialog>
  );
}
