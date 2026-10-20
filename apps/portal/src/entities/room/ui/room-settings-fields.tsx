import type {GameRulesDto} from '@qgames/api/gateway/model';
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

import {formatSeconds, TIME_CONTROL_MODE_LABELS} from '../lib/settings-labels';
import type {RoomSettingsValues} from '../model/settings';

export interface RoomSettingsFieldsProps {
  form: UseFormReturn<RoomSettingsValues>;
  /** Правила игры: режимы времени и границы настроек. */
  rules: GameRulesDto;
  /** Префикс id полей, чтобы на странице могло быть несколько форм. */
  idPrefix: string;
}

/** Поля настроек комнаты: число раундов и правила времени. */
export function RoomSettingsFields({
  form,
  rules,
  idPrefix,
}: RoomSettingsFieldsProps) {
  const {errors} = form.formState;
  const mode = useWatch({control: form.control, name: 'timeControl.mode'});
  const {modes, moveSeconds} = rules.timeControl;
  const {rounds} = rules.gameSettingsLimits;

  return (
    <>
      <Field data-invalid={errors.gameSettings?.rounds !== undefined}>
        <FieldLabel htmlFor={`${idPrefix}-rounds`}>Число раундов</FieldLabel>
        <Input
          id={`${idPrefix}-rounds`}
          type="number"
          inputMode="numeric"
          min={rounds.min}
          max={rounds.max}
          step={1}
          aria-invalid={errors.gameSettings?.rounds !== undefined}
          {...form.register('gameSettings.rounds', {valueAsNumber: true})}
        />
        <FieldDescription>
          От {rounds.min} до {rounds.max}
        </FieldDescription>
        <FieldError errors={[errors.gameSettings?.rounds]} />
      </Field>
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
