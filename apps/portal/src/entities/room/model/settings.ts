import type {
  GameRulesDto,
  GameSettingsLimitsDto,
  IntRangeDto,
  RoomSettingsDto,
} from '@qgames/api/portal/model';
import {CheckersSettingsDto, NothingSettingsDto} from '@qgames/api/portal/zod';
import type {Path} from 'react-hook-form';
import {z} from 'zod';

import {formatSeconds} from '../lib/settings-labels';

/** Запас часов, который форма предлагает, если у игры нет часов по умолчанию. */
const FALLBACK_BASE_SECONDS = 300;

/**
 * Схема настроек игры: union по `gameCode` из сгенерированных схем, вариант
 * игры комнаты дополнен её границами (`gameSettingsLimits`). Остальные
 * варианты union — без границ: форма заполняется настройками своей игры.
 */
function gameSettingsSchema(limits: GameSettingsLimitsDto) {
  const nothing =
    limits.gameCode === 'nothing'
      ? NothingSettingsDto.extend({
          rounds: NothingSettingsDto.shape.rounds
            .min(limits.rounds.min)
            .max(limits.rounds.max),
        })
      : NothingSettingsDto;
  const checkers =
    limits.gameCode === 'checkers'
      ? CheckersSettingsDto.extend({
          variant: CheckersSettingsDto.shape.variant.refine(
            variant => limits.variants.includes(variant),
            'Этот вариант игра не поддерживает',
          ),
        })
      : CheckersSettingsDto;
  return z.discriminatedUnion('gameCode', [nothing, checkers]);
}

function inRange(value: number, range: IntRangeDto): boolean {
  return Number.isInteger(value) && value >= range.min && value <= range.max;
}

/**
 * Схема формы настроек комнаты: шахматные часы (включены или нет, запас и
 * добавка в секундах) и настройки игры, с границами из `rules` ответа
 * `GET /api/games/{gameCode}`. Без часов их поля не проверяются: они скрыты, а
 * значения остаются для повторного включения.
 */
export function roomSettingsSchema(rules: GameRulesDto) {
  const {optional, baseSeconds, incrementSeconds} = rules.timeControl;
  return z.object({
    timeControl: z
      .object({
        enabled: z
          .boolean()
          .refine(enabled => optional || enabled, 'Игра идёт только с часами'),
        baseSeconds: z.number().or(z.nan()),
        incrementSeconds: z.number().or(z.nan()),
      })
      .superRefine((value, ctx) => {
        if (!value.enabled) {
          return;
        }
        if (!inRange(value.baseSeconds, baseSeconds)) {
          ctx.addIssue({
            code: 'custom',
            path: ['baseSeconds'],
            message: `Запас — от ${formatSeconds(baseSeconds.min)} до ${formatSeconds(baseSeconds.max)}`,
          });
        }
        if (!inRange(value.incrementSeconds, incrementSeconds)) {
          ctx.addIssue({
            code: 'custom',
            path: ['incrementSeconds'],
            message: `Введите целое число от ${String(incrementSeconds.min)} до ${String(incrementSeconds.max)}`,
          });
        }
      }),
    gameSettings: gameSettingsSchema(rules.gameSettingsLimits),
  });
}

export type RoomSettingsValues = z.infer<ReturnType<typeof roomSettingsSchema>>;

/**
 * Поля формы, которые подсвечиваются по `VALIDATION_ERROR`. Имена совпадают с
 * полями тела `PUT …/settings`; у создания комнаты они идут с префиксом `settings.`.
 */
export const ROOM_SETTINGS_FIELDS = [
  'timeControl.baseSeconds',
  'timeControl.incrementSeconds',
  'gameSettings.rounds',
  'gameSettings.variant',
] as const satisfies readonly Path<RoomSettingsValues>[];

/**
 * Значения формы из настроек комнаты (или настроек игры по умолчанию). Без
 * часов поля часов заполняются часами игры по умолчанию — на случай включения.
 */
export function toRoomSettingsValues(
  settings: RoomSettingsDto,
  rules: GameRulesDto,
): RoomSettingsValues {
  const {baseSeconds, incrementSeconds} = rules.timeControl;
  const clock = settings.timeControl ??
    rules.defaultSettings.timeControl ?? {
      baseSeconds: Math.min(
        Math.max(FALLBACK_BASE_SECONDS, baseSeconds.min),
        baseSeconds.max,
      ),
      incrementSeconds: incrementSeconds.min,
    };
  return {
    timeControl: {
      enabled:
        settings.timeControl !== undefined && settings.timeControl !== null,
      baseSeconds: clock.baseSeconds,
      incrementSeconds: clock.incrementSeconds,
    },
    gameSettings: settings.gameSettings,
  };
}

/** Тело запроса из значений формы: без часов — `timeControl: null`. */
export function toRoomSettings(values: RoomSettingsValues): RoomSettingsDto {
  const {enabled, baseSeconds, incrementSeconds} = values.timeControl;
  return {
    timeControl: enabled ? {baseSeconds, incrementSeconds} : null,
    gameSettings: values.gameSettings,
  };
}
