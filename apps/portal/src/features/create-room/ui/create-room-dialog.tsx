import {zodResolver} from '@hookform/resolvers/zod';
import {applyFieldErrors} from '@qgames/api';
import {useCreateRoom} from '@qgames/api/gateway';
import type {
  GameDetailsResponse,
  GameRulesDto,
} from '@qgames/api/gateway/model';
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
import {useNavigate} from '@tanstack/react-router';
import {useMemo} from 'react';
import {useForm} from 'react-hook-form';

import {
  GAME_IN_DEVELOPMENT_HINT,
  playersLabel,
  type GameCode,
  type GameEntry,
} from '@/entities/game';
import {
  ROOM_SETTINGS_FIELDS,
  roomErrorMessage,
  RoomSettingsFields,
  roomSettingsSchema,
  toRoomSettings,
  toRoomSettingsValues,
  type RoomSettingsValues,
} from '@/entities/room';
import {WithHint} from '@/shared/ui';

export interface CreateRoomDialogProps {
  game: GameEntry;
  /** Игра из `GET /api/games/{gameCode}`: название и правила для формы. */
  details: GameDetailsResponse;
}

/** Ошибки полей у создания комнаты приходят с префиксом тела запроса. */
const CREATE_FIELD_PREFIX = 'settings.';

interface CreateRoomFormProps {
  gameCode: GameCode;
  rules: GameRulesDto;
}

function CreateRoomForm({gameCode, rules}: CreateRoomFormProps) {
  const navigate = useNavigate();
  const schema = useMemo(() => roomSettingsSchema(rules), [rules]);
  const form = useForm<RoomSettingsValues>({
    resolver: zodResolver(schema),
    defaultValues: toRoomSettingsValues(rules.defaultSettings, rules),
  });
  const createRoom = useCreateRoom({
    mutation: {
      onSuccess: room => {
        void navigate({
          to: '/games/$gameCode/rooms/$roomId',
          params: {gameCode, roomId: room.id},
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
            gameCode,
            data: {settings: toRoomSettings(values)},
          });
        })(event);
      }}
    >
      <FieldGroup>
        <RoomSettingsFields form={form} rules={rules} idPrefix="create-room" />
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

/** Создание комнаты с настройками игры: число раундов и правила времени. */
export function CreateRoomDialog({game, details}: CreateRoomDialogProps) {
  // Без пакета игры на фронте доску не нарисовать — комнату не создаём.
  const hint = game.load === undefined ? GAME_IN_DEVELOPMENT_HINT : null;
  const {rules} = details;
  return (
    <Dialog>
      <WithHint hint={hint}>
        <DialogTrigger asChild>
          <Button disabled={hint !== null}>Создать комнату</Button>
        </DialogTrigger>
      </WithHint>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новая комната: {details.title}</DialogTitle>
          <DialogDescription>{details.description}</DialogDescription>
        </DialogHeader>
        <p className="text-sm">
          {playersLabel(rules.minPlayers, rules.maxPlayers)}. Вы станете
          владельцем комнаты и первым игроком — отправьте ссылку на комнату
          друзьям.
        </p>
        <CreateRoomForm gameCode={game.code} rules={rules} />
      </DialogContent>
    </Dialog>
  );
}
