import {zodResolver} from '@hookform/resolvers/zod';
import {applyFieldErrors} from '@qgames/api';
import {
  useGetGame,
  useToAdvancedSettings,
  useUpdateRoomSettings,
} from '@qgames/api/portal';
import type {GameRulesDto} from '@qgames/api/portal/model';
import {Button} from '@qgames/ui/components/Button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@qgames/ui/components/Dialog';
import {FieldError, FieldGroup} from '@qgames/ui/components/Field';
import {toast} from '@qgames/ui/components/Sonner';
import {useMemo, useRef, useState} from 'react';
import {useForm} from 'react-hook-form';

import {
  defaultSimple,
  ROOM_SETTINGS_FIELDS,
  roomErrorMessage,
  RoomSettingsFields,
  roomSettingsSchema,
  sameSimple,
  toRoomSettingsRequest,
  toRoomSettingsValues,
  type Membership,
  type RoomSettingsValues,
  type RoomView,
} from '@/entities/room';
import {testIds} from './RoomSettingsDialog.testIds';

const IN_GAME_HINT = 'Правила игры меняются только между партиями';

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
  const schema = useMemo(() => roomSettingsSchema(rules), [rules]);
  const form = useForm<RoomSettingsValues>({
    resolver: zodResolver(schema),
    defaultValues: toRoomSettingsValues(room.settings, rules),
  });
  const updateSettings = useUpdateRoomSettings({
    mutation: {
      // Новые настройки приходят событием settings-changed потока комнаты.
      onSuccess: () => {
        onSaved();
        toast.success('Настройки комнаты сохранены');
      },
      onError: error => {
        // Поля тела PUT совпадают с полями формы, префикса нет.
        if (!applyFieldErrors(error, form.setError, ROOM_SETTINGS_FIELDS)) {
          form.setError('root', {message: roomErrorMessage(error)});
        }
      },
    },
  });
  // Включение продвинутых правил: сервер выводит advanced из текущих simple.
  const toAdvanced = useToAdvancedSettings({
    mutation: {
      onSuccess: advanced => {
        form.setValue('advanced', advanced, {shouldDirty: true});
      },
      // Simple-поля проверены формой до запроса: ошибка тут — общая.
      onError: error => {
        form.setError('root', {message: roomErrorMessage(error)});
      },
    },
  });

  // Advanced на момент выключения и simple, с которым ушли в «Простые»: пока
  // simple не меняли, обратное включение возвращает эти правила без запроса.
  const leftAdvanced = useRef<{
    simple: NonNullable<RoomSettingsValues['simple']>;
    advanced: NonNullable<RoomSettingsValues['advanced']>;
  } | null>(null);

  const onAdvancedChange = (enabled: boolean) => {
    form.clearErrors('root');
    if (!enabled) {
      // Выключение: правила снова задаются simple (прежние или по умолчанию).
      const simple = form.getValues('simple') ?? defaultSimple(rules);
      const advanced = form.getValues('advanced');
      // Копии: getValues отдаёт объекты формы, а правки полей меняют их на месте.
      leftAdvanced.current =
        simple !== null && advanced !== null
          ? {simple: {...simple}, advanced: structuredClone(advanced)}
          : null;
      form.setValue('simple', simple, {shouldDirty: true});
      // Без shouldDirty: react-hook-form падает, сравнивая с null объект
      // advanced из значений по умолчанию (комната сохранена с advanced).
      form.setValue('advanced', null);
      return;
    }
    void form.trigger('simple').then(valid => {
      const simple = form.getValues('simple');
      if (!valid || simple === null) {
        return;
      }
      const left = leftAdvanced.current;
      if (left !== null && sameSimple(left.simple, simple)) {
        form.setValue('advanced', left.advanced, {shouldDirty: true});
        return;
      }
      toAdvanced.mutate({gameCode: room.gameCode, data: simple});
    });
  };

  return (
    <form
      noValidate
      onSubmit={event => {
        void form.handleSubmit(values => {
          updateSettings.mutate({
            gameCode: room.gameCode,
            roomId: room.id,
            data: toRoomSettingsRequest(values, inGame),
          });
        })(event);
      }}
    >
      <FieldGroup>
        <RoomSettingsFields
          form={form}
          rules={rules}
          idPrefix="room-settings"
          gameLockReason={inGame ? IN_GAME_HINT : null}
          onAdvancedChange={onAdvancedChange}
          advancedPending={toAdvanced.isPending}
        />
        <FieldError errors={[form.formState.errors.root]} />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Отмена
            </Button>
          </DialogClose>
          <Button
            type="submit"
            data-testid={testIds.submitButton}
            disabled={updateSettings.isPending || toAdvanced.isPending}
          >
            Сохранить
          </Button>
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

/**
 * Настройки комнаты у владельца: места наблюдателей — в любой момент, правила
 * игры — между партиями.
 */
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
      <DialogTrigger asChild>
        <Button variant="outline" data-testid={testIds.openButton}>
          Настройки
        </Button>
      </DialogTrigger>
      <DialogContent
        data-testid={testIds.root}
        // Описания у окна нет: Radix без этого предупреждает в консоли.
        aria-describedby={undefined}
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>Настройки комнаты</DialogTitle>
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
