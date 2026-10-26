import type {
  CheckersSettingsDtoVariant,
  CheckersTimePresetDtoPreset,
  GameSettingsDto,
  RoomSettingsDto,
  TimeControlDto,
} from '@qgames/api/portal/model';

/** Есть ли у партии таймер: таймер один — шахматные часы. */
export const TIME_CONTROL_LABELS = {
  none: 'Без таймера',
  clock: 'Шахматные часы',
} as const;

/** Варианты правил шашек (`CheckersVariant`). */
export const CHECKERS_VARIANT_LABELS: Readonly<
  Record<CheckersSettingsDtoVariant, string>
> = {
  RUSSIAN: 'Русские',
  INTERNATIONAL: 'Международные',
  ENGLISH: 'Английские',
};

/** Официальные контроли времени шашек (`CheckersTimePreset`). */
export const CHECKERS_TIME_PRESET_LABELS: Readonly<
  Record<CheckersTimePresetDtoPreset, string>
> = {
  CLASSIC: 'Классика',
  RAPID: 'Быстрые',
  BLITZ: 'Блиц',
};

/** «30 с», «2 мин», «1 мин 30 с», «1 ч 20 мин». */
export function formatSeconds(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [
    hours > 0 ? `${String(hours)} ч` : null,
    minutes > 0 ? `${String(minutes)} мин` : null,
    seconds > 0 || totalSeconds === 0 ? `${String(seconds)} с` : null,
  ];
  return parts.filter(part => part !== null).join(' ');
}

/** Шахматные часы: «10 мин + 5 с»; без добавки — только запас («30 мин»). */
export function formatClock({
  baseSeconds,
  incrementSeconds,
}: TimeControlDto): string {
  return incrementSeconds > 0
    ? `${formatSeconds(baseSeconds)} + ${String(incrementSeconds)} с`
    : formatSeconds(baseSeconds);
}

export interface SettingsRow {
  label: string;
  value: string;
}

/** Строка описания настроек игры — по `gameCode`. */
function gameSettingsRow(settings: GameSettingsDto): SettingsRow {
  switch (settings.gameCode) {
    case 'nothing':
      return {label: 'Раундов', value: String(settings.rounds)};
    case 'checkers':
      return {
        label: 'Вариант правил',
        value: CHECKERS_VARIANT_LABELS[settings.variant],
      };
  }
}

/** Строки описания настроек комнаты: настройки игры и часы. */
export function roomSettingsRows(settings: RoomSettingsDto): SettingsRow[] {
  const {timeControl} = settings;
  return [
    gameSettingsRow(settings.gameSettings),
    {
      label: 'Время',
      value:
        timeControl === undefined || timeControl === null
          ? TIME_CONTROL_LABELS.none
          : formatClock(timeControl),
    },
  ];
}
