import {zodResolver} from '@hookform/resolvers/zod';
import {useGetGame, useUpdateRoomSettings} from '@qgames/api/gateway';
import type {GameRulesDto} from '@qgames/api/gateway/model';
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
import {useMemo, useState} from 'react';
import {useForm} from 'react-hook-form';

import {
  ROOM_SETTINGS_FIELDS,
  roomErrorMessage,
  RoomSettingsFields,
  roomSettingsSchema,
  setRoomCache,
  toRoomSettings,
  toRoomSettingsValues,
  type Membership,
  type RoomSettingsValues,
  type RoomView,
} from '@/entities/room';
import {applyFieldErrors} from '@/shared/lib';
import {WithHint} from '@/shared/ui';

const IN_GAME_HINT = 'Настройки меняются только между партиями';

export interface RoomSettingsDialogProps {
  room: RoomView;
  membership: Membership;
}

interface SettingsFormProps {
  room: RoomView;
  inGame: boolean;
  rules: GameRulesDto;
  onSaved: () => void;
}

function SettingsForm({room, inGame, rules, onSaved}: SettingsFormProps) {
  const queryClient = useQueryClient();
  const schema = useMemo(() => roomSettingsSchema(rules), [rules]);
  const form = useForm<RoomSettingsValues>({
    resolver: zodResolver(schema),
    defaultValues: toRoomSettingsValues(room.settings, rules),
  });
  const updateSettings = useUpdateRoomSettings({
    mutation: {
      onSuccess: data => {
        setRoomCache(queryClient, room.id, data);
        onSaved();
      },
      onError: error => {
        // Поля тела PUT совпадают с полями формы, префикса нет.
        if (!applyFieldErrors(error, form.setError, ROOM_SETTINGS_FIELDS)) {
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
          updateSettings.mutate({
            gameCode: room.gameCode,
            roomId: room.id,
            data: toRoomSettings(values),
          });
        })(event);
      }}
    >
      <FieldGroup>
        <RoomSettingsFields
          form={form}
          rules={rules}
          idPrefix="room-settings"
        />
        {inGame ? (
          <p className="text-sm text-muted-foreground">{IN_GAME_HINT}.</p>
        ) : null}
        <FieldError errors={[form.formState.errors.root]} />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Отмена
            </Button>
          </DialogClose>
          <WithHint hint={inGame ? IN_GAME_HINT : null}>
            <Button type="submit" disabled={inGame || updateSettings.isPending}>
              Сохранить
            </Button>
          </WithHint>
        </DialogFooter>
      </FieldGroup>
    </form>
  );
}

function SettingsContent(props: Omit<SettingsFormProps, 'rules'>) {
  const info = useGetGame(props.room.gameCode);
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
  return <SettingsForm {...props} rules={info.data.rules} />;
}

/** Смена настроек комнаты владельцем между партиями. */
export function RoomSettingsDialog({
  room,
  membership,
}: RoomSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  if (!membership.isOwner) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <WithHint hint={membership.inGame ? IN_GAME_HINT : null}>
        <DialogTrigger asChild>
          <Button variant="outline" disabled={membership.inGame}>
            Настройки
          </Button>
        </DialogTrigger>
      </WithHint>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Настройки комнаты</DialogTitle>
          <DialogDescription>
            Новые настройки действуют со следующей партии.
          </DialogDescription>
        </DialogHeader>
        <SettingsContent
          room={room}
          inGame={membership.inGame}
          onSaved={() => {
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
