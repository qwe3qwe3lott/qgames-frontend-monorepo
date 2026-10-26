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
import {Input} from '@qgames/ui/components/input';
import {Label} from '@qgames/ui/components/label';
import {RadioGroup, RadioGroupItem} from '@qgames/ui/components/radio-group';
import {Controller, useWatch, type UseFormReturn} from 'react-hook-form';

import {
  CHECKERS_VARIANT_LABELS,
  formatSeconds,
  TIME_CONTROL_MODE_LABELS,
} from '../lib/settings-labels';
import type {RoomSettingsValues} from '../model/settings';

export interface RoomSettingsFieldsProps {
  form: UseFormReturn<RoomSettingsValues>;
  /** Правила игры: режимы времени и границы настроек. */
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

/** Поля настроек комнаты: настройки игры и правила времени. */
export function RoomSettingsFields({
  form,
  rules,
  idPrefix,
}: RoomSettingsFieldsProps) {
  const {errors} = form.formState;
  const mode = useWatch({control: form.control, name: 'timeControl.mode'});
  const {modes, moveSeconds} = rules.timeControl;

  return (
    <>
      <GameSettingsFields form={form} rules={rules} idPrefix={idPrefix} />
      <FieldSet>
        <FieldLegend variant="label">Время</FieldLegend>
        <Controller
          control={form.control}
          name="timeControl.mode"
          render={({field}) => (
            <RadioGroup
              value={field.value}
              onValueChange={next => {
                const selected = modes.find(item => item === next);
                if (selected !== undefined) {
                  field.onChange(selected);
                }
              }}
              className="flex flex-wrap gap-4"
            >
              {modes.map(item => (
                <Label
                  key={item}
                  htmlFor={`${idPrefix}-mode-${item}`}
                  className="flex items-center gap-2"
                >
                  <RadioGroupItem
                    id={`${idPrefix}-mode-${item}`}
                    value={item}
                  />
                  {TIME_CONTROL_MODE_LABELS[item]}
                </Label>
              ))}
            </RadioGroup>
          )}
        />
        <FieldError errors={[errors.timeControl?.mode]} />
      </FieldSet>
      {mode === 'PER_MOVE' ? (
        <Field data-invalid={errors.timeControl?.moveSeconds !== undefined}>
          <FieldLabel htmlFor={`${idPrefix}-move-seconds`}>
            Секунд на ход
          </FieldLabel>
          <Input
            id={`${idPrefix}-move-seconds`}
            type="number"
            inputMode="numeric"
            min={moveSeconds.min}
            max={moveSeconds.max}
            step={1}
            aria-invalid={errors.timeControl?.moveSeconds !== undefined}
            {...form.register('timeControl.moveSeconds', {valueAsNumber: true})}
          />
          <FieldDescription>
            От {formatSeconds(moveSeconds.min)} до{' '}
            {formatSeconds(moveSeconds.max)}
          </FieldDescription>
          <FieldError errors={[errors.timeControl?.moveSeconds]} />
        </Field>
      ) : null}
    </>
  );
}
