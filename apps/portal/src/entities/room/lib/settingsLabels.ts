import type {
  CheckersAdvancedSettingsDto,
  CheckersSimpleSettingsDtoTime,
  CheckersSimpleSettingsDtoVariant,
  GameAdvancedSettingsDto,
  GameSimpleSettingsDto,
  NothingSimpleSettingsDtoTime,
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
  Record<CheckersSimpleSettingsDtoVariant, string>
> = {
  RUSSIAN: 'Русские',
  INTERNATIONAL: 'Международные',
  ENGLISH: 'Английские',
};

/** Пресеты времени шашек (`CheckersTime`). */
export const CHECKERS_TIME_LABELS: Readonly<
  Record<CheckersSimpleSettingsDtoTime, string>
> = {
  NONE: TIME_CONTROL_LABELS.none,
  CLASSIC: 'Классика',
  RAPID: 'Быстрые',
  BLITZ: 'Блиц',
};

/** Пресеты времени «игры в ничто» (`NothingTime`). */
export const NOTHING_TIME_LABELS: Readonly<
  Record<NothingSimpleSettingsDtoTime, string>
> = {
  NONE: TIME_CONTROL_LABELS.none,
  CLASSIC: 'Классика',
};

/** Правила хода шашек, которые владелец задаёт в advanced-настройках. */
export type CheckersRuleFlag = Exclude<
  keyof CheckersAdvancedSettingsDto,
  'gameCode' | 'variant' | 'timeControl'
>;

export const CHECKERS_RULE_LABELS: Readonly<Record<CheckersRuleFlag, string>> =
  {
    captureRequired: 'Бить обязательно',
    maxCaptureRequired: 'Бить наибольшее число шашек',
    menMoveBackward: 'Простая ходит назад',
    menCaptureBackward: 'Простая бьёт назад',
    flyingKings: 'Дальнобойные дамки',
    promoteMidCapture: 'Ставшая дамкой посреди взятия бьёт дальше как дамка',
    removeCapturedAfterMove: 'Турецкий удар: сбитые снимаются после хода',
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
}: Pick<TimeControlDto, 'baseSeconds' | 'incrementSeconds'>): string {
  return incrementSeconds > 0
    ? `${formatSeconds(baseSeconds)} + ${String(incrementSeconds)} с`
    : formatSeconds(baseSeconds);
}

export interface SettingsRow {
  label: string;
  value: string;
}

/** Строка настроек игры из advanced (по ним идёт партия) — по `gameCode`. */
function gameSettingsRow(settings: GameAdvancedSettingsDto): SettingsRow {
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

/** Название пресета времени simple-настроек. */
function presetLabel(simple: GameSimpleSettingsDto): string {
  switch (simple.gameCode) {
    case 'nothing':
      return NOTHING_TIME_LABELS[simple.time];
    case 'checkers':
      return CHECKERS_TIME_LABELS[simple.time];
  }
}

/** Время партии: пресет simple-режима с его часами или часы advanced. */
function timeRow(settings: RoomSettingsDto): SettingsRow {
  const {timeControl} = settings.advanced;
  if (!timeControl.enabled) {
    return {label: 'Время', value: TIME_CONTROL_LABELS.none};
  }
  const clock = formatClock(timeControl);
  const {simple} = settings;
  return {
    label: 'Время',
    value:
      simple === undefined || simple === null
        ? clock
        : `${presetLabel(simple)} (${clock})`,
  };
}

/**
 * Строки описания настроек комнаты: настройки игры, время, режим правил и
 * места наблюдателей.
 */
export function roomSettingsRows(settings: RoomSettingsDto): SettingsRow[] {
  const advanced = settings.simple === undefined || settings.simple === null;
  return [
    gameSettingsRow(settings.advanced),
    timeRow(settings),
    ...(advanced ? [{label: 'Правила', value: 'Продвинутые'}] : []),
    {
      label: 'Мест наблюдателей',
      value: String(settings.room.maxSpectators),
    },
  ];
}
