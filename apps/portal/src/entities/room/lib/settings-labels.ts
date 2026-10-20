import type {
  RoomSettingsDto,
  TimeControlDtoMode,
} from '@qgames/api/gateway/model';

export const TIME_CONTROL_MODE_LABELS: Readonly<
  Record<TimeControlDtoMode, string>
> = {
  NONE: 'Без таймера',
  PER_MOVE: 'Время на ход',
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

/** Строки описания настроек комнаты: раунды и правила времени. */
export function roomSettingsRows(settings: RoomSettingsDto): SettingsRow[] {
  const {mode, moveSeconds} = settings.timeControl;
  return [
    {label: 'Раундов', value: String(settings.gameSettings.rounds)},
    {
      label: TIME_CONTROL_MODE_LABELS.PER_MOVE,
      value:
        mode === 'PER_MOVE' && moveSeconds !== undefined && moveSeconds !== null
          ? formatSeconds(moveSeconds)
          : TIME_CONTROL_MODE_LABELS.NONE,
    },
  ];
}
