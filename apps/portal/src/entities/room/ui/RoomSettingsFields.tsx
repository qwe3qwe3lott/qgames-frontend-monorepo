import {
  CheckersAdvancedSettingsDtoEndgameRule,
  CheckersAdvancedSettingsDtoFirstColor,
  type CheckersRulePresetDto,
  type CheckersSettingsLimitsDto,
  type GameRulesDto,
  type NothingSettingsLimitsDto,
} from '@qgames/api/portal/model';
import {Button} from '@qgames/ui/components/Button';
import {Checkbox} from '@qgames/ui/components/Checkbox';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@qgames/ui/components/Field';
import {Input} from '@qgames/ui/components/Input';
import {Label} from '@qgames/ui/components/Label';
import {ToggleGroup, ToggleGroupItem} from '@qgames/ui/components/ToggleGroup';
import type {ReactNode} from 'react';
import {Controller, useWatch, type UseFormReturn} from 'react-hook-form';

import {
  CHECKERS_COLOR_LABELS,
  CHECKERS_ENDGAME_RULE_LABELS,
  CHECKERS_RULE_LABELS,
  CHECKERS_TIME_LABELS,
  CHECKERS_VARIANT_LABELS,
  formatBoardSize,
  formatClock,
  formatDrawQuietMoves,
  formatSeconds,
  NOTHING_TIME_LABELS,
  TIME_CONTROL_LABELS,
  type CheckersRuleFlag,
} from '../lib/settingsLabels';
import type {RoomSettingsValues} from '../model/settings';
import {testIds} from './RoomSettingsFields.testIds';

export interface RoomSettingsFieldsProps {
  form: UseFormReturn<RoomSettingsValues>;
  /** Правила игры: границы настроек, пресеты времени. */
  rules: GameRulesDto;
  /** Префикс id полей, чтобы на странице могло быть несколько форм. */
  idPrefix: string;
  /** Причина, по которой правила игры сейчас не меняются; null — меняются. */
  gameLockReason: string | null;
  /** Переключатель «Простые / Продвинутые»: включение заполняет advanced-поля. */
  onAdvancedChange: (enabled: boolean) => void;
  /** Advanced-поля заполняются (идёт запрос к серверу). */
  advancedPending: boolean;
}

type FormProps = Pick<RoomSettingsFieldsProps, 'form' | 'idPrefix'>;

interface Option {
  value: string;
  label: string;
  /** Пояснение мелким текстом под подписью (часы пресета времени). */
  hint?: string;
}

/** Классы сегментного переключателя: дорожка и выбранный сегмент. */
const SEGMENTS_CLASS = 'h-auto max-w-full flex-wrap rounded-lg bg-muted p-1';
const SEGMENT_CLASS =
  'h-auto min-h-8 rounded-md px-3 py-1 text-muted-foreground hover:bg-background/60 hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm';

/** Сегменты [options]: выбрано ровно одно значение, повторный клик его не снимает. */
function Segments({
  value,
  options,
  onChange,
  label,
  invalid = false,
  disabled = false,
  itemProps,
}: {
  value: string;
  options: readonly Option[];
  onChange: (value: string) => void;
  label: string;
  invalid?: boolean;
  disabled?: boolean;
  /** Атрибуты сегмента для тестов. */
  itemProps: (option: Option) => Record<`data-${string}`, string>;
}) {
  return (
    <ToggleGroup
      type="single"
      spacing={1}
      value={value}
      onValueChange={next => {
        // Пустое значение — клик по выбранному сегменту: выбор не снимается.
        if (options.some(item => item.value === next)) {
          onChange(next);
        }
      }}
      disabled={disabled}
      aria-label={label}
      aria-invalid={invalid}
      className={SEGMENTS_CLASS}
    >
      {options.map(item => (
        <ToggleGroupItem
          key={item.value}
          value={item.value}
          className={SEGMENT_CLASS}
          {...itemProps(item)}
        >
          {item.hint === undefined ? (
            item.label
          ) : (
            <span className="flex flex-col items-center leading-tight">
              <span>{item.label}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {item.hint}
              </span>
            </span>
          )}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

type SegmentedName =
  | 'simple.variant'
  | 'simple.time'
  | 'advanced.boardSize'
  | 'advanced.firstColor'
  | 'advanced.endgameRule'
  | 'advanced.drawQuietMoves'
  | 'advanced.timeControl.enabled';

/** Выбор одного значения сегментами; значение вне [options] не принимается. */
function SegmentedField({
  form,
  name,
  legend,
  options,
  hideLegend = false,
}: Pick<FormProps, 'form'> & {
  name: SegmentedName;
  legend: string;
  options: readonly Option[];
  /** Подпись уже стоит рядом (шапка блока): у поля только aria-label. */
  hideLegend?: boolean;
}) {
  const parse = (value: string): string | number | boolean => {
    switch (name) {
      // Часы включаются сегментами «без таймера / часы».
      case 'advanced.timeControl.enabled':
        return value === 'true';
      case 'advanced.boardSize':
      case 'advanced.drawQuietMoves':
        return Number(value);
      default:
        return value;
    }
  };
  return (
    <Controller
      control={form.control}
      name={name}
      render={({field, fieldState}) => {
        const segments = (
          <Segments
            value={String(field.value)}
            options={options}
            onChange={next => {
              field.onChange(parse(next));
            }}
            label={legend}
            invalid={fieldState.error !== undefined}
            itemProps={item => ({
              'data-testid': testIds.option,
              'data-field': name,
              'data-value': item.value,
            })}
          />
        );
        if (hideLegend) {
          return segments;
        }
        return (
          <FieldSet className="gap-2">
            <FieldLegend variant="label">{legend}</FieldLegend>
            {segments}
            <FieldError errors={[fieldState.error]} />
          </FieldSet>
        );
      }}
    />
  );
}

/** Секция окна: заголовок, справа — элемент управления секцией. */
function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

/**
 * Рамка группы полей, которые выставляются вместе (пресетом): заголовок,
 * справа — элемент управления группой.
 */
function Block({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-lg border bg-muted/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold">{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

/** Подпись перед кнопками пресета: кнопки заполняют поля, а не сохраняют. */
const PRESET_LABEL = 'Выставить пресет';

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
        data-testid={testIds.field}
        data-field={name}
        type="number"
        inputMode="numeric"
        min={rounds.min}
        max={rounds.max}
        step={1}
        className="max-w-24"
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
      label: NOTHING_TIME_LABELS[item.time],
      hint: formatClock(item),
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
      <SegmentedField
        form={form}
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
  limits,
}: Pick<FormProps, 'form'> & {limits: CheckersSettingsLimitsDto}) {
  const variant = useWatch({control: form.control, name: 'simple.variant'});
  const options: Option[] = [
    {value: 'NONE', label: CHECKERS_TIME_LABELS.NONE},
    ...limits.timePresets
      .filter(item => item.variant === variant)
      .map(item => ({
        value: item.time,
        label: CHECKERS_TIME_LABELS[item.time],
        hint: formatClock(item),
      })),
  ];
  return (
    <>
      <SegmentedField
        form={form}
        name="simple.variant"
        legend="Вариант правил"
        options={variantOptions(limits)}
      />
      <SegmentedField
        form={form}
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

/**
 * Пресеты вариантов шашек для advanced: кнопка подставляет правила варианта
 * (доска, первый ход, ничьи, правила хода) в поля. Часы не трогает — у них свои
 * пресеты.
 */
function CheckersRulePresets({
  form,
  limits,
}: Pick<FormProps, 'form'> & {limits: CheckersSettingsLimitsDto}) {
  if (limits.rulePresets.length === 0) {
    return null;
  }
  const apply = (rules: CheckersRulePresetDto) => {
    const options = {shouldDirty: true, shouldValidate: true};
    form.setValue('advanced.boardSize', rules.boardSize, options);
    form.setValue('advanced.firstColor', rules.firstColor, options);
    form.setValue('advanced.endgameRule', rules.endgameRule, options);
    form.setValue('advanced.drawQuietMoves', rules.drawQuietMoves, options);
    for (const flag of CHECKERS_RULE_FLAGS) {
      form.setValue(`advanced.${flag}`, rules[flag], options);
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {PRESET_LABEL} варианта:
      </span>
      {limits.rulePresets.map(item => (
        <Button
          key={item.variant}
          type="button"
          variant="outline"
          size="sm"
          data-testid={testIds.rulePreset}
          data-value={item.variant}
          onClick={() => {
            apply(item);
          }}
        >
          {CHECKERS_VARIANT_LABELS[item.variant]}
        </Button>
      ))}
    </div>
  );
}

const CHECKERS_COLORS = Object.values(CheckersAdvancedSettingsDtoFirstColor);
const CHECKERS_ENDGAME_RULES = Object.values(
  CheckersAdvancedSettingsDtoEndgameRule,
);

/**
 * Advanced шашек — одна рамка, которую заполняет пресет варианта: доска, первый
 * ход, правила хода галочками и правила ничьих.
 */
function CheckersAdvancedFields({
  form,
  idPrefix,
  limits,
}: FormProps & {limits: CheckersSettingsLimitsDto}) {
  return (
    <Block title="Правила шашек">
      <CheckersRulePresets form={form} limits={limits} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SegmentedField
          form={form}
          name="advanced.boardSize"
          legend="Доска"
          options={limits.boardSizes.map(size => ({
            value: String(size),
            label: formatBoardSize(size),
          }))}
        />
        <SegmentedField
          form={form}
          name="advanced.firstColor"
          legend="Первыми ходят"
          options={CHECKERS_COLORS.map(color => ({
            value: color,
            label: CHECKERS_COLOR_LABELS[color],
          }))}
        />
      </div>
      <FieldSet className="gap-2">
        <FieldLegend variant="label">Правила хода</FieldLegend>
        <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
          {CHECKERS_RULE_FLAGS.map(flag => (
            <Controller
              key={flag}
              control={form.control}
              name={`advanced.${flag}`}
              render={({field}) => (
                <Label
                  htmlFor={`${idPrefix}-${flag}`}
                  className="flex items-start gap-2 font-normal"
                >
                  <Checkbox
                    id={`${idPrefix}-${flag}`}
                    data-testid={testIds.field}
                    data-field={`advanced.${flag}`}
                    className="mt-px"
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
        </div>
      </FieldSet>
      <SegmentedField
        form={form}
        name="advanced.drawQuietMoves"
        legend="Ничья после ходов только дамками без взятий"
        options={limits.drawQuietMoves.map(moves => ({
          value: String(moves),
          label: formatDrawQuietMoves(moves),
        }))}
      />
      <SegmentedField
        form={form}
        name="advanced.endgameRule"
        legend="Правила окончаний"
        options={CHECKERS_ENDGAME_RULES.map(rule => ({
          value: rule,
          label: CHECKERS_ENDGAME_RULE_LABELS[rule],
        }))}
      />
    </Block>
  );
}

/**
 * Официальные контроли времени шашек, сгруппированные по вариантам: кнопка
 * подставляет запас и добавку в поля часов, значения видны в полях.
 */
function CheckersTimePresets({
  form,
  limits,
}: Pick<FormProps, 'form'> & {limits: CheckersSettingsLimitsDto}) {
  const groups = limits.variants
    .map(variant => ({
      variant,
      presets: limits.timePresets.filter(item => item.variant === variant),
    }))
    .filter(group => group.presets.length > 0);
  if (groups.length === 0) {
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
      <span className="text-sm text-muted-foreground">{PRESET_LABEL}:</span>
      <div className="flex flex-col gap-3 sm:gap-2">
        {groups.map(group => (
          <div
            key={group.variant}
            className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3"
          >
            <span className="text-sm sm:w-32">
              {CHECKERS_VARIANT_LABELS[group.variant]}
            </span>
            <div className="flex flex-wrap gap-2">
              {group.presets.map(item => (
                <Button
                  key={item.time}
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid={testIds.timePreset}
                  data-variant={item.variant}
                  data-value={item.time}
                  onClick={() => {
                    apply(item.baseSeconds, item.incrementSeconds);
                  }}
                >
                  {CHECKERS_TIME_LABELS[item.time]}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Запас и добавка часов одной строкой: запас — минуты и секунды двумя полями
 * (в форме — секунды целиком), диапазоны и ошибки — под строкой.
 */
function ClockFields({
  form,
  idPrefix,
  rules,
}: FormProps & {rules: GameRulesDto}) {
  const {baseSeconds: baseRange, incrementSeconds: incrementRange} =
    rules.timeControl;
  const {error: baseError} = form.getFieldState(
    'advanced.timeControl.baseSeconds',
    form.formState,
  );
  const {error: incrementError} = form.getFieldState(
    'advanced.timeControl.incrementSeconds',
    form.formState,
  );
  const errors = [baseError, incrementError].filter(
    error => error !== undefined,
  );
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Controller
          control={form.control}
          name="advanced.timeControl.baseSeconds"
          render={({field}) => {
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
            const invalid = baseError !== undefined;
            return (
              <Field
                orientation="horizontal"
                data-invalid={invalid}
                className="w-auto gap-2"
              >
                <Label htmlFor={`${idPrefix}-base-minutes`}>Запас</Label>
                <Input
                  id={`${idPrefix}-base-minutes`}
                  data-testid={testIds.baseMinutes}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  aria-label="Запас, минуты"
                  aria-invalid={invalid}
                  className="w-16"
                  value={minutes}
                  onChange={event => {
                    set(event.target.valueAsNumber, seconds);
                  }}
                />
                <span className="text-sm">мин</span>
                <Input
                  id={`${idPrefix}-base-seconds`}
                  data-testid={testIds.baseSeconds}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={59}
                  step={1}
                  aria-label="Запас, секунды"
                  aria-invalid={invalid}
                  className="w-16"
                  value={seconds}
                  onChange={event => {
                    set(minutes, event.target.valueAsNumber);
                  }}
                />
                <span className="text-sm">с</span>
              </Field>
            );
          }}
        />
        <Field
          orientation="horizontal"
          data-invalid={incrementError !== undefined}
          className="w-auto gap-2"
        >
          <Label htmlFor={`${idPrefix}-increment`}>Добавка за ход</Label>
          <Input
            id={`${idPrefix}-increment`}
            data-testid={testIds.field}
            data-field="advanced.timeControl.incrementSeconds"
            type="number"
            inputMode="numeric"
            min={incrementRange.min}
            max={incrementRange.max}
            step={1}
            className="w-16"
            aria-invalid={incrementError !== undefined}
            {...form.register('advanced.timeControl.incrementSeconds', {
              valueAsNumber: true,
            })}
          />
          <span className="text-sm">с</span>
        </Field>
      </div>
      <FieldDescription>
        Запас от {formatSeconds(baseRange.min)} до{' '}
        {formatSeconds(baseRange.max)}, добавка от {incrementRange.min} до{' '}
        {incrementRange.max} с (0 — без добавки)
      </FieldDescription>
      <FieldError errors={errors} />
    </div>
  );
}

/**
 * Часы advanced — рамка «Время»: в шапке без таймера (если игра разрешает) или
 * шахматные часы, внутри — пресеты (у шашек) и поля часов.
 */
function TimeControlFields({
  form,
  idPrefix,
  rules,
}: FormProps & {rules: GameRulesDto}) {
  const enabled = useWatch({
    control: form.control,
    name: 'advanced.timeControl.enabled',
  });
  const limits = rules.gameSettingsLimits;
  const mode = rules.timeControl.optional ? (
    <SegmentedField
      form={form}
      name="advanced.timeControl.enabled"
      legend="Время"
      hideLegend
      options={[
        {value: 'false', label: TIME_CONTROL_LABELS.none},
        {value: 'true', label: TIME_CONTROL_LABELS.clock},
      ]}
    />
  ) : (
    <span className="text-sm">{TIME_CONTROL_LABELS.clock}</span>
  );
  return (
    <Block title="Время" action={mode}>
      {enabled ? (
        <>
          {limits.gameCode === 'checkers' ? (
            <CheckersTimePresets form={form} limits={limits} />
          ) : null}
          <ClockFields form={form} idPrefix={idPrefix} rules={rules} />
        </>
      ) : null}
    </Block>
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
      return <CheckersSimpleFields form={form} limits={limits} />;
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
        data-testid={testIds.field}
        data-field="room.maxSpectators"
        type="number"
        inputMode="numeric"
        min={spectators.min}
        max={spectators.max}
        step={1}
        className="max-w-24"
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

const RULES_MODES: readonly Option[] = [
  {value: 'simple', label: 'Простые'},
  {value: 'advanced', label: 'Продвинутые'},
];

/**
 * Поля настроек комнаты двумя секциями: «Комната» (места наблюдателей) и
 * «Правила игры» — simple или, переключателем «Продвинутые», advanced.
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
  const rulesMode = (
    <Segments
      value={enabled ? 'advanced' : 'simple'}
      options={RULES_MODES}
      onChange={next => {
        onAdvancedChange(next === 'advanced');
      }}
      label="Режим правил"
      disabled={advancedPending || (enabled && !simpleAvailable)}
      itemProps={item => ({
        'data-testid': testIds.rulesMode,
        'data-value': item.value,
      })}
    />
  );
  return (
    <div data-testid={testIds.root} className="flex flex-col gap-6">
      <Section title="Комната">
        <RoomOptionsFields form={form} idPrefix={idPrefix} rules={rules} />
      </Section>
      <FieldSeparator />
      {/* Блокировка правил во время партии выключает и переключатель режима. */}
      <fieldset disabled={gameLockReason !== null} className="min-w-0">
        <Section title="Правила игры" action={rulesMode}>
          {gameLockReason === null ? null : (
            <p className="text-sm text-muted-foreground">{gameLockReason}.</p>
          )}
          {enabled ? (
            <AdvancedFields form={form} idPrefix={idPrefix} rules={rules} />
          ) : (
            <SimpleFields form={form} idPrefix={idPrefix} rules={rules} />
          )}
        </Section>
      </fieldset>
    </div>
  );
}
