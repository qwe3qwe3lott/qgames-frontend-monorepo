import type {
  CheckersSettingsLimitsDto,
  GameRulesDto,
  NothingSettingsLimitsDto,
} from '@qgames/api/portal/model';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@qgames/ui/components/field';
import {Button} from '@qgames/ui/components/button';
import {Input} from '@qgames/ui/components/input';
import {Label} from '@qgames/ui/components/label';
import {RadioGroup, RadioGroupItem} from '@qgames/ui/components/radio-group';
import {Controller, useWatch, type UseFormReturn} from 'react-hook-form';

import {
  CHECKERS_TIME_PRESET_LABELS,
  CHECKERS_VARIANT_LABELS,
  formatClock,
  formatSeconds,
  TIME_CONTROL_LABELS,
} from '../lib/settings-labels';
import type {RoomSettingsValues} from '../model/settings';

export interface RoomSettingsFieldsProps {
  form: UseFormReturn<RoomSettingsValues>;
  /** Правила игры: границы часов и настроек игры. */
  rules: GameRulesDto;
  /** Префикс id полей, чтобы на странице могло быть несколько форм. */
  idPrefix: string;
}

interface GameFieldProps<L> {
  form: UseFormReturn<RoomSettingsValues>;
  limits: L;
  idPrefix: string;
}

/** «Игра в ничто»: число раундов. */
function NothingSettingsFields({
  form,
  limits,
  idPrefix,
}: GameFieldProps<NothingSettingsLimitsDto>) {
  const {rounds} = limits;
  const {error} = form.getFieldState('gameSettings.rounds', form.formState);
  return (
    <Field data-invalid={error !== undefined}>
      <FieldLabel htmlFor={`${idPrefix}-rounds`}>Число раундов</FieldLabel>
      <Input
        id={`${idPrefix}-rounds`}
        type="number"
        inputMode="numeric"
        min={rounds.min}
        max={rounds.max}
        step={1}
        aria-invalid={error !== undefined}
        {...form.register('gameSettings.rounds', {valueAsNumber: true})}
      />
      <FieldDescription>
        От {rounds.min} до {rounds.max}
      </FieldDescription>
      <FieldError errors={[error]} />
    </Field>
  );
}

/** Шашки: вариант правил из доступных игре (`limits.variants`). */
function CheckersSettingsFields({
  form,
  limits,
  idPrefix,
}: GameFieldProps<CheckersSettingsLimitsDto>) {
  const {variants} = limits;
  return (
    <FieldSet>
      <FieldLegend variant="label">Вариант правил</FieldLegend>
      <Controller
        control={form.control}
        name="gameSettings.variant"
        render={({field, fieldState}) => (
          <>
            <RadioGroup
              value={field.value}
              onValueChange={next => {
                const selected = variants.find(item => item === next);
                if (selected !== undefined) {
                  field.onChange(selected);
                }
              }}
              aria-invalid={fieldState.error !== undefined}
              className="flex flex-wrap gap-4"
            >
              {variants.map(item => (
                <Label
                  key={item}
                  htmlFor={`${idPrefix}-variant-${item}`}
                  className="flex items-center gap-2"
                >
                  <RadioGroupItem
                    id={`${idPrefix}-variant-${item}`}
                    value={item}
                  />
                  {CHECKERS_VARIANT_LABELS[item]}
                </Label>
              ))}
            </RadioGroup>
            <FieldError errors={[fieldState.error]} />
          </>
        )}
      />
    </FieldSet>
  );
}

/** Поля настроек конкретной игры — по `gameCode` границ из правил игры. */
function GameSettingsFields({form, rules, idPrefix}: RoomSettingsFieldsProps) {
  const limits = rules.gameSettingsLimits;
  switch (limits.gameCode) {
    case 'nothing':
      return (
        <NothingSettingsFields
          form={form}
          limits={limits}
          idPrefix={idPrefix}
        />
      );
    case 'checkers':
      return (
        <CheckersSettingsFields
          form={form}
          limits={limits}
          idPrefix={idPrefix}
        />
      );
  }
}

/**
 * Официальные контроли времени шашек для выбранного варианта: кнопка
 * подставляет запас и добавку в поля часов (это не отдельный вид таймера).
 */
function CheckersTimePresets({
  form,
  limits,
}: {
  form: UseFormReturn<RoomSettingsValues>;
  limits: CheckersSettingsLimitsDto;
}) {
  const variant = useWatch({
    control: form.control,
    name: 'gameSettings.variant',
  });
  const presets = limits.timePresets.filter(item => item.variant === variant);
  if (presets.length === 0) {
    return null;
  }
  const apply = (baseSeconds: number, incrementSeconds: number) => {
    const options = {shouldDirty: true, shouldValidate: true};
    form.setValue('timeControl.baseSeconds', baseSeconds, options);
    form.setValue('timeControl.incrementSeconds', incrementSeconds, options);
  };
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-muted-foreground">Контроли времени</span>
      <div className="flex flex-wrap gap-2">
        {presets.map(item => (
          <Button
            key={item.preset}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              apply(item.baseSeconds, item.incrementSeconds);
            }}
          >
            {CHECKERS_TIME_PRESET_LABELS[item.preset]} ({formatClock(item)})
          </Button>
        ))}
      </div>
    </div>
  );
}

/** Запас часов: минуты и секунды двумя полями, в форме — секунды целиком. */
function BaseTimeField({form, rules, idPrefix}: RoomSettingsFieldsProps) {
  const range = rules.timeControl.baseSeconds;
  return (
    <Controller
      control={form.control}
      name="timeControl.baseSeconds"
      render={({field, fieldState}) => {
        const total = Number.isNaN(field.value) ? 0 : field.value;
        const minutes = Math.floor(total / 60);
        const seconds = total % 60;
        // Пустое поле — ноль: запас собирается из двух чисел.
        const set = (nextMinutes: number, nextSeconds: number) => {
          field.onChange(
            (Number.isNaN(nextMinutes) ? 0 : nextMinutes) * 60 +
              (Number.isNaN(nextSeconds) ? 0 : nextSeconds),
          );
        };
        const invalid = fieldState.error !== undefined;
        return (
          <FieldSet data-invalid={invalid}>
            <FieldLegend variant="label">Запас</FieldLegend>
            <div className="flex items-center gap-2">
              <Input
                id={`${idPrefix}-base-minutes`}
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                aria-label="Запас, минуты"
                aria-invalid={invalid}
                className="w-24"
                value={minutes}
                onChange={event => {
                  set(event.target.valueAsNumber, seconds);
                }}
              />
              <span className="text-sm">мин</span>
              <Input
                id={`${idPrefix}-base-seconds`}
                type="number"
                inputMode="numeric"
                min={0}
                max={59}
                step={1}
                aria-label="Запас, секунды"
                aria-invalid={invalid}
                className="w-24"
                value={seconds}
                onChange={event => {
                  set(minutes, event.target.valueAsNumber);
                }}
              />
              <span className="text-sm">с</span>
            </div>
            <FieldDescription>
              От {formatSeconds(range.min)} до {formatSeconds(range.max)}
            </FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </FieldSet>
        );
      }}
    />
  );
}

/** Время партии: без таймера (если игра разрешает) или шахматные часы. */
function TimeControlFields({form, rules, idPrefix}: RoomSettingsFieldsProps) {
  const {errors} = form.formState;
  const enabled = useWatch({
    control: form.control,
    name: 'timeControl.enabled',
  });
  const {optional, incrementSeconds} = rules.timeControl;
  const limits = rules.gameSettingsLimits;
  return (
    <>
      <FieldSet>
        <FieldLegend variant="label">Время</FieldLegend>
        {optional ? (
          <Controller
            control={form.control}
            name="timeControl.enabled"
            render={({field}) => (
              <RadioGroup
                value={field.value ? 'clock' : 'none'}
                onValueChange={next => {
                  field.onChange(next === 'clock');
                }}
                className="flex flex-wrap gap-4"
              >
                {(['none', 'clock'] as const).map(item => (
                  <Label
                    key={item}
                    htmlFor={`${idPrefix}-timer-${item}`}
                    className="flex items-center gap-2"
                  >
                    <RadioGroupItem
                      id={`${idPrefix}-timer-${item}`}
                      value={item}
                    />
                    {TIME_CONTROL_LABELS[item]}
                  </Label>
                ))}
              </RadioGroup>
            )}
          />
        ) : (
          <p className="text-sm">{TIME_CONTROL_LABELS.clock}</p>
        )}
        <FieldError errors={[errors.timeControl?.enabled]} />
      </FieldSet>
      {enabled ? (
        <>
          {limits.gameCode === 'checkers' ? (
            <CheckersTimePresets form={form} limits={limits} />
          ) : null}
          <BaseTimeField form={form} rules={rules} idPrefix={idPrefix} />
          <Field
            data-invalid={errors.timeControl?.incrementSeconds !== undefined}
          >
            <FieldLabel htmlFor={`${idPrefix}-increment`}>
              Добавка за ход, с
            </FieldLabel>
            <Input
              id={`${idPrefix}-increment`}
              type="number"
              inputMode="numeric"
              min={incrementSeconds.min}
              max={incrementSeconds.max}
              step={1}
              className="w-24"
              aria-invalid={errors.timeControl?.incrementSeconds !== undefined}
              {...form.register('timeControl.incrementSeconds', {
                valueAsNumber: true,
              })}
            />
            <FieldDescription>
              От {incrementSeconds.min} до {incrementSeconds.max}, 0 — без
              добавки
            </FieldDescription>
            <FieldError errors={[errors.timeControl?.incrementSeconds]} />
          </Field>
        </>
      ) : null}
    </>
  );
}

/** Поля настроек комнаты: настройки игры и часы. */
export function RoomSettingsFields({
  form,
  rules,
  idPrefix,
}: RoomSettingsFieldsProps) {
  return (
    <>
      <GameSettingsFields form={form} rules={rules} idPrefix={idPrefix} />
      <TimeControlFields form={form} rules={rules} idPrefix={idPrefix} />
    </>
  );
}
