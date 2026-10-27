import type {
  CheckersSettingsLimitsDto,
  GameRulesDto,
  NothingSettingsLimitsDto,
} from '@qgames/api/portal/model';
import {Button} from '@qgames/ui/components/button';
import {Checkbox} from '@qgames/ui/components/checkbox';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@qgames/ui/components/field';
import {Input} from '@qgames/ui/components/input';
import {Label} from '@qgames/ui/components/label';
import {RadioGroup, RadioGroupItem} from '@qgames/ui/components/radio-group';
import {Controller, useWatch, type UseFormReturn} from 'react-hook-form';

import {
  CHECKERS_RULE_LABELS,
  CHECKERS_TIME_LABELS,
  CHECKERS_VARIANT_LABELS,
  formatClock,
  formatSeconds,
  NOTHING_TIME_LABELS,
  TIME_CONTROL_LABELS,
  type CheckersRuleFlag,
} from '../lib/settings-labels';
import type {RoomSettingsValues} from '../model/settings';

export interface RoomSettingsFieldsProps {
  form: UseFormReturn<RoomSettingsValues>;
  /** Правила игры: границы настроек, пресеты времени. */
  rules: GameRulesDto;
  /** Префикс id полей, чтобы на странице могло быть несколько форм. */
  idPrefix: string;
  /** Причина, по которой правила игры сейчас не меняются; null — меняются. */
  gameLockReason: string | null;
  /** Галочка «Продвинутые правила»: включение заполняет advanced-поля. */
  onAdvancedChange: (enabled: boolean) => void;
  /** Advanced-поля заполняются (идёт запрос к серверу). */
  advancedPending: boolean;
}

type FormProps = Pick<RoomSettingsFieldsProps, 'form' | 'idPrefix'>;

interface Option {
  value: string;
  label: string;
}

/** Выбор одного значения радиокнопками; значение вне [options] не принимается. */
function RadioField({
  form,
  idPrefix,
  name,
  legend,
  options,
}: FormProps & {
  name:
    | 'simple.variant'
    | 'simple.time'
    | 'advanced.variant'
    | 'advanced.timeControl.enabled';
  legend: string;
  options: readonly Option[];
}) {
  const id = `${idPrefix}-${name.replaceAll('.', '-')}`;
  return (
    <FieldSet>
      <FieldLegend variant="label">{legend}</FieldLegend>
      <Controller
        control={form.control}
        name={name}
        render={({field, fieldState}) => (
          <>
            <RadioGroup
              value={String(field.value)}
              onValueChange={next => {
                const selected = options.find(item => item.value === next);
                if (selected === undefined) {
                  return;
                }
                // Часы включаются радиокнопками «без таймера / часы».
                field.onChange(
                  name === 'advanced.timeControl.enabled'
                    ? selected.value === 'true'
                    : selected.value,
                );
              }}
              aria-invalid={fieldState.error !== undefined}
              className="flex flex-wrap gap-4"
            >
              {options.map(item => (
                <Label
                  key={item.value}
                  htmlFor={`${id}-${item.value}`}
                  className="flex items-center gap-2"
                >
                  <RadioGroupItem
                    id={`${id}-${item.value}`}
                    value={item.value}
                  />
                  {item.label}
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

/** Число раундов «игры в ничто». */
function RoundsField({
  form,
  idPrefix,
  name,
  limits,
}: FormProps & {
  name: 'simple.rounds' | 'advanced.rounds';
  limits: NothingSettingsLimitsDto;
}) {
  const {rounds} = limits;
  const {error} = form.getFieldState(name, form.formState);
  const id = `${idPrefix}-${name.replaceAll('.', '-')}`;
  return (
    <Field data-invalid={error !== undefined}>
      <FieldLabel htmlFor={id}>Число раундов</FieldLabel>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={rounds.min}
        max={rounds.max}
        step={1}
        aria-invalid={error !== undefined}
        {...form.register(name, {valueAsNumber: true})}
      />
      <FieldDescription>
        От {rounds.min} до {rounds.max}
      </FieldDescription>
      <FieldError errors={[error]} />
    </Field>
  );
}

function variantOptions(limits: CheckersSettingsLimitsDto): Option[] {
  return limits.variants.map(item => ({
    value: item,
    label: CHECKERS_VARIANT_LABELS[item],
  }));
}

/** Simple «игры в ничто»: раунды и пресет времени. */
function NothingSimpleFields({
  form,
  idPrefix,
  limits,
}: FormProps & {limits: NothingSettingsLimitsDto}) {
  const options: Option[] = [
    {value: 'NONE', label: NOTHING_TIME_LABELS.NONE},
    ...limits.timePresets.map(item => ({
      value: item.time,
      label: `${NOTHING_TIME_LABELS[item.time]} (${formatClock(item)})`,
    })),
  ];
  return (
    <>
      <RoundsField
        form={form}
        idPrefix={idPrefix}
        name="simple.rounds"
        limits={limits}
      />
      <RadioField
        form={form}
        idPrefix={idPrefix}
        name="simple.time"
        legend="Время"
        options={options}
      />
    </>
  );
}

/** Simple шашек: вариант правил и официальный контроль времени варианта. */
function CheckersSimpleFields({
  form,
  idPrefix,
  limits,
}: FormProps & {limits: CheckersSettingsLimitsDto}) {
  const variant = useWatch({control: form.control, name: 'simple.variant'});
  const options: Option[] = [
    {value: 'NONE', label: CHECKERS_TIME_LABELS.NONE},
    ...limits.timePresets
      .filter(item => item.variant === variant)
      .map(item => ({
        value: item.time,
        label: `${CHECKERS_TIME_LABELS[item.time]} (${formatClock(item)})`,
      })),
  ];
  return (
    <>
      <RadioField
        form={form}
        idPrefix={idPrefix}
        name="simple.variant"
        legend="Вариант правил"
        options={variantOptions(limits)}
      />
      <RadioField
        form={form}
        idPrefix={idPrefix}
        name="simple.time"
        legend="Время"
        options={options}
      />
    </>
  );
}

const CHECKERS_RULE_FLAGS = [
  'captureRequired',
  'maxCaptureRequired',
  'menMoveBackward',
  'menCaptureBackward',
  'flyingKings',
  'promoteMidCapture',
  'removeCapturedAfterMove',
] as const satisfies readonly CheckersRuleFlag[];

/** Advanced шашек: вариант (доска, первый ход) и правила хода галочками. */
function CheckersAdvancedFields({
  form,
  idPrefix,
  limits,
}: FormProps & {limits: CheckersSettingsLimitsDto}) {
  return (
    <>
      <RadioField
        form={form}
        idPrefix={idPrefix}
        name="advanced.variant"
        legend="Вариант правил (доска и первый ход)"
        options={variantOptions(limits)}
      />
      <FieldSet>
        <FieldLegend variant="label">Правила хода</FieldLegend>
        {CHECKERS_RULE_FLAGS.map(flag => (
          <Controller
            key={flag}
            control={form.control}
            name={`advanced.${flag}`}
            render={({field}) => (
              <Label
                htmlFor={`${idPrefix}-${flag}`}
                className="flex items-center gap-2 font-normal"
              >
                <Checkbox
                  id={`${idPrefix}-${flag}`}
                  checked={field.value}
                  onCheckedChange={checked => {
                    field.onChange(checked === true);
                  }}
                />
                {CHECKERS_RULE_LABELS[flag]}
              </Label>
            )}
          />
        ))}
      </FieldSet>
    </>
  );
}

/**
 * Официальные контроли времени шашек для выбранного варианта advanced: кнопка
 * подставляет запас и добавку в поля часов.
 */
function CheckersTimePresets({
  form,
  limits,
}: {
  form: UseFormReturn<RoomSettingsValues>;
  limits: CheckersSettingsLimitsDto;
}) {
  const variant = useWatch({control: form.control, name: 'advanced.variant'});
  const presets = limits.timePresets.filter(item => item.variant === variant);
  if (presets.length === 0) {
    return null;
  }
  const apply = (baseSeconds: number, incrementSeconds: number) => {
    const options = {shouldDirty: true, shouldValidate: true};
    form.setValue('advanced.timeControl.baseSeconds', baseSeconds, options);
    form.setValue(
      'advanced.timeControl.incrementSeconds',
      incrementSeconds,
      options,
    );
  };
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-muted-foreground">Контроли времени</span>
      <div className="flex flex-wrap gap-2">
        {presets.map(item => (
          <Button
            key={item.time}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              apply(item.baseSeconds, item.incrementSeconds);
            }}
          >
            {CHECKERS_TIME_LABELS[item.time]} ({formatClock(item)})
          </Button>
        ))}
      </div>
    </div>
  );
}

/** Запас часов: минуты и секунды двумя полями, в форме — секунды целиком. */
function BaseTimeField({
  form,
  idPrefix,
  rules,
}: FormProps & {rules: GameRulesDto}) {
  const range = rules.timeControl.baseSeconds;
  return (
    <Controller
      control={form.control}
      name="advanced.timeControl.baseSeconds"
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

/** Часы advanced: без таймера (если игра разрешает) или шахматные часы. */
function TimeControlFields({
  form,
  idPrefix,
  rules,
}: FormProps & {rules: GameRulesDto}) {
  const enabled = useWatch({
    control: form.control,
    name: 'advanced.timeControl.enabled',
  });
  const {error: incrementError} = form.getFieldState(
    'advanced.timeControl.incrementSeconds',
    form.formState,
  );
  const {optional, incrementSeconds} = rules.timeControl;
  const limits = rules.gameSettingsLimits;
  return (
    <>
      {optional ? (
        <RadioField
          form={form}
          idPrefix={idPrefix}
          name="advanced.timeControl.enabled"
          legend="Время"
          options={[
            {value: 'false', label: TIME_CONTROL_LABELS.none},
            {value: 'true', label: TIME_CONTROL_LABELS.clock},
          ]}
        />
      ) : (
        <FieldSet>
          <FieldLegend variant="label">Время</FieldLegend>
          <p className="text-sm">{TIME_CONTROL_LABELS.clock}</p>
        </FieldSet>
      )}
      {enabled ? (
        <>
          {limits.gameCode === 'checkers' ? (
            <CheckersTimePresets form={form} limits={limits} />
          ) : null}
          <BaseTimeField form={form} idPrefix={idPrefix} rules={rules} />
          <Field data-invalid={incrementError !== undefined}>
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
              aria-invalid={incrementError !== undefined}
              {...form.register('advanced.timeControl.incrementSeconds', {
                valueAsNumber: true,
              })}
            />
            <FieldDescription>
              От {incrementSeconds.min} до {incrementSeconds.max}, 0 — без
              добавки
            </FieldDescription>
            <FieldError errors={[incrementError]} />
          </Field>
        </>
      ) : null}
    </>
  );
}

/** Simple-поля конкретной игры — по `gameCode` границ из правил игры. */
function SimpleFields({
  form,
  idPrefix,
  rules,
}: FormProps & {rules: GameRulesDto}) {
  const limits = rules.gameSettingsLimits;
  switch (limits.gameCode) {
    case 'nothing':
      return (
        <NothingSimpleFields form={form} idPrefix={idPrefix} limits={limits} />
      );
    case 'checkers':
      return (
        <CheckersSimpleFields form={form} idPrefix={idPrefix} limits={limits} />
      );
  }
}

/** Advanced-поля конкретной игры и часы. */
function AdvancedFields({
  form,
  idPrefix,
  rules,
}: FormProps & {rules: GameRulesDto}) {
  const limits = rules.gameSettingsLimits;
  return (
    <>
      {limits.gameCode === 'nothing' ? (
        <RoundsField
          form={form}
          idPrefix={idPrefix}
          name="advanced.rounds"
          limits={limits}
        />
      ) : (
        <CheckersAdvancedFields
          form={form}
          idPrefix={idPrefix}
          limits={limits}
        />
      )}
      <TimeControlFields form={form} idPrefix={idPrefix} rules={rules} />
    </>
  );
}

/** Лимит наблюдателей: вошедшие при понижении остаются. */
function RoomOptionsFields({
  form,
  idPrefix,
  rules,
}: FormProps & {rules: GameRulesDto}) {
  const {spectators} = rules;
  const {error} = form.getFieldState('room.maxSpectators', form.formState);
  return (
    <Field data-invalid={error !== undefined}>
      <FieldLabel htmlFor={`${idPrefix}-max-spectators`}>
        Мест для наблюдателей
      </FieldLabel>
      <Input
        id={`${idPrefix}-max-spectators`}
        type="number"
        inputMode="numeric"
        min={spectators.min}
        max={spectators.max}
        step={1}
        className="w-24"
        aria-invalid={error !== undefined}
        {...form.register('room.maxSpectators', {valueAsNumber: true})}
      />
      <FieldDescription>
        От {spectators.min} до {spectators.max}. Если понизить, вошедшие
        наблюдатели останутся
      </FieldDescription>
      <FieldError errors={[error]} />
    </Field>
  );
}

/**
 * Поля настроек комнаты: места наблюдателей и правила игры — simple или, с
 * галочкой «Продвинутые правила», advanced.
 */
export function RoomSettingsFields({
  form,
  rules,
  idPrefix,
  gameLockReason,
  onAdvancedChange,
  advancedPending,
}: RoomSettingsFieldsProps) {
  const advanced = useWatch({control: form.control, name: 'advanced'});
  const enabled = advanced !== null;
  const {simple} = rules.defaultSettings;
  const simpleAvailable = simple !== undefined && simple !== null;
  return (
    <>
      <RoomOptionsFields form={form} idPrefix={idPrefix} rules={rules} />
      <fieldset
        disabled={gameLockReason !== null}
        className="flex flex-col gap-6"
      >
        <Label
          htmlFor={`${idPrefix}-advanced`}
          className="flex items-center gap-2"
        >
          <Checkbox
            id={`${idPrefix}-advanced`}
            checked={enabled}
            disabled={advancedPending || (enabled && !simpleAvailable)}
            onCheckedChange={checked => {
              onAdvancedChange(checked === true);
            }}
          />
          Продвинутые правила
        </Label>
        {gameLockReason === null ? null : (
          <p className="text-sm text-muted-foreground">{gameLockReason}.</p>
        )}
        {enabled ? (
          <AdvancedFields form={form} idPrefix={idPrefix} rules={rules} />
        ) : (
          <SimpleFields form={form} idPrefix={idPrefix} rules={rules} />
        )}
      </fieldset>
    </>
  );
}
