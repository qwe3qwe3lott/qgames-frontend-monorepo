import type {
  CheckersAdvancedSettingsDto,
  CheckersAdvancedSettingsDtoEndgameRule,
  CheckersAdvancedSettingsDtoFirstColor,
  CheckersSimpleSettingsDtoTime,
  CheckersSimpleSettingsDtoVariant,
  GameSimpleSettingsDto,
  NothingSimpleSettingsDtoTime,
  RoomSettingsDto,
  TimeControlDto,
  TimeControlDtoBonusType,
} from '@qgames/api/portal/model';

/** Есть ли у партии таймер: таймер один — часы. */
export const TIME_CONTROL_LABELS = {
  none: 'Без таймера',
  clock: 'Часы',
} as const;

/** Вид добавочного времени часов (`TimeBonusType`). */
export const TIME_BONUS_LABELS: Readonly<
  Record<TimeControlDtoBonusType, string>
> = {
  INCREMENT: 'Инкремент',
  DELAY: 'Задержка',
};

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

/** Цвет, который ходит первым (`CheckersColor`). */
export const CHECKERS_COLOR_LABELS: Readonly<
  Record<CheckersAdvancedSettingsDtoFirstColor, string>
> = {
  WHITE: 'Белые',
  BLACK: 'Чёрные',
};

/** Правила окончаний шашек (`CheckersEndgameRule`). */
export const CHECKERS_ENDGAME_RULE_LABELS: Readonly<
  Record<CheckersAdvancedSettingsDtoEndgameRule, string>
> = {
  NONE: 'Нет',
  RUSSIAN: 'Русские',
  INTERNATIONAL: 'Международные',
};

/** Доска шашек: «8×8». */
export function formatBoardSize(size: number): string {
  return `${String(size)}×${String(size)}`;
}

const pluralRules = new Intl.PluralRules('ru-RU');

const MOVE_FORMS: Readonly<Record<Intl.LDMLPluralRule, string>> = {
  zero: 'ходов',
  one: 'ход',
  two: 'хода',
  few: 'хода',
  many: 'ходов',
  other: 'хода',
};

/**
 * Ничья по ходам только дамками: счётчик — ходы обеих сторон в сумме, в
 * подписи — у каждой стороны («по 15 ходов»).
 */
export function formatDrawQuietMoves(moves: number): string {
  const perSide = moves / 2;
  return `По ${String(perSide)} ${MOVE_FORMS[pluralRules.select(perSide)]}`;
}

/** Правила хода шашек, которые владелец задаёт галочками в advanced-настройках. */
export type CheckersRuleFlag = Exclude<
  keyof CheckersAdvancedSettingsDto,
  | 'gameCode'
  | 'timeControl'
  | 'boardSize'
  | 'firstColor'
  | 'endgameRule'
  | 'drawQuietMoves'
>;

/** Правила хода шашек в порядке показа. */
export const CHECKERS_RULE_FLAGS = [
  'captureRequired',
  'maxCaptureRequired',
  'menMoveBackward',
  'menCaptureBackward',
  'flyingKings',
  'promoteMidCapture',
  'removeCapturedAfterMove',
] as const satisfies readonly CheckersRuleFlag[];

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

/**
 * Часы: «10 мин + 5 с инкремент», «10 мин + 5 с задержка»; без добавочного
 * времени — только запас («30 мин»). У пресетов вида нет: они всегда с
 * инкрементом.
 */
export function formatClock({
  baseSeconds,
  bonusSeconds,
  bonusType = 'INCREMENT',
}: Pick<TimeControlDto, 'baseSeconds' | 'bonusSeconds'> &
  Partial<Pick<TimeControlDto, 'bonusType'>>): string {
  return bonusSeconds > 0
    ? `${formatSeconds(baseSeconds)} + ${String(bonusSeconds)} с ${TIME_BONUS_LABELS[bonusType].toLowerCase()}`
    : formatSeconds(baseSeconds);
}

export interface SettingsRow {
  label: string;
  value: string;
}

/**
 * Строка настроек игры — по `gameCode`. У шашек в simple-режиме — вариант
 * правил, в advanced варианта нет — доска.
 */
function gameSettingsRow({simple, advanced}: RoomSettingsDto): SettingsRow {
  switch (advanced.gameCode) {
    case 'nothing':
      return {label: 'Раундов', value: String(advanced.rounds)};
    case 'checkers':
      return simple?.gameCode === 'checkers'
        ? {
            label: 'Вариант правил',
            value: CHECKERS_VARIANT_LABELS[simple.variant],
          }
        : {label: 'Доска', value: formatBoardSize(advanced.boardSize)};
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

/** Выбраны ли продвинутые правила (simple-настроек нет). */
export function isAdvancedSettings(settings: RoomSettingsDto): boolean {
  return settings.simple === undefined || settings.simple === null;
}

/**
 * Строки описания настроек комнаты: при простых правилах — настройки игры и
 * время, при продвинутых их нет (они в `advancedSettingsRows`); места
 * наблюдателей — всегда.
 */
export function roomSettingsRows(settings: RoomSettingsDto): SettingsRow[] {
  return [
    ...(isAdvancedSettings(settings)
      ? []
      : [gameSettingsRow(settings), timeRow(settings)]),
    {
      label: 'Мест наблюдателей',
      value: String(settings.room.maxSpectators),
    },
  ];
}

function yesNo(value: boolean): string {
  return value ? 'Да' : 'Нет';
}

/** Все продвинутые правила комнаты для просмотра — по `gameCode`. */
export function advancedSettingsRows(settings: RoomSettingsDto): SettingsRow[] {
  const {advanced} = settings;
  switch (advanced.gameCode) {
    case 'nothing':
      return [
        {label: 'Раундов', value: String(advanced.rounds)},
        timeRow(settings),
      ];
    case 'checkers':
      return [
        {label: 'Доска', value: formatBoardSize(advanced.boardSize)},
        {
          label: 'Первыми ходят',
          value: CHECKERS_COLOR_LABELS[advanced.firstColor],
        },
        ...CHECKERS_RULE_FLAGS.map(flag => ({
          label: CHECKERS_RULE_LABELS[flag],
          value: yesNo(advanced[flag]),
        })),
        {
          label: 'Ничья после ходов только дамками без взятий',
          value: formatDrawQuietMoves(advanced.drawQuietMoves),
        },
        {
          label: 'Правила окончаний',
          value: CHECKERS_ENDGAME_RULE_LABELS[advanced.endgameRule],
        },
        timeRow(settings),
      ];
  }
}
