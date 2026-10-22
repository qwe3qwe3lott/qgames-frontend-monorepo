import type {
  CheckersSettingsDtoVariant,
  GameSettingsDto,
  RoomSettingsDto,
  TimeControlDtoMode,
} from '@qgames/api/gateway/model';

export const TIME_CONTROL_MODE_LABELS: Readonly<
  Record<TimeControlDtoMode, string>
> = {
  NONE: 'Без таймера',
  PER_MOVE: 'Время на ход',
};

/** Варианты правил шашек (`CheckersVariant`). */
export const CHECKERS_VARIANT_LABELS: Readonly<
  Record<CheckersSettingsDtoVariant, string>
> = {
  RUSSIAN: 'Русские',
  INTERNATIONAL: 'Международные',
  ENGLISH: 'Английские',
};

/** «30 с», «2 мин», «1 мин 30 с». */
export function formatSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) {
    return `${String(seconds)} с`;
  }
  return seconds === 0
    ? `${String(minutes)} мин`
    : `${String(minutes)} мин ${String(seconds)} с`;
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

/** Строки описания настроек комнаты: настройки игры и правила времени. */
export function roomSettingsRows(settings: RoomSettingsDto): SettingsRow[] {
  const {mode, moveSeconds} = settings.timeControl;
  return [
    gameSettingsRow(settings.gameSettings),
    {
      label: TIME_CONTROL_MODE_LABELS.PER_MOVE,
      value:
        mode === 'PER_MOVE' && moveSeconds !== undefined && moveSeconds !== null
          ? formatSeconds(moveSeconds)
          : TIME_CONTROL_MODE_LABELS.NONE,
    },
  ];
}
