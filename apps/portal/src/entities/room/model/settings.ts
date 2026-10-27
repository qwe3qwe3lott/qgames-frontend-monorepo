import type {
  GameRulesDto,
  GameSettingsLimitsDto,
  GameSimpleSettingsDto,
  IntRangeDto,
  RoomSettingsDto,
  UpdateRoomSettingsRequest,
} from '@qgames/api/portal/model';
import {
  CheckersAdvancedSettingsDto,
  CheckersSimpleSettingsDto,
  NothingAdvancedSettingsDto,
  NothingSimpleSettingsDto,
  RoomOptionsDto,
} from '@qgames/api/portal/zod';
import type {Path} from 'react-hook-form';
import {z} from 'zod';

import {formatSeconds} from '../lib/settings-labels';

function inRange(value: number, range: IntRangeDto): boolean {
  return Number.isInteger(value) && value >= range.min && value <= range.max;
}

/** Число из поля ввода: пустое поле даёт NaN, его ловит проверка границ. */
const numberInput = z.number().or(z.nan());

/**
 * Шахматные часы advanced-настроек с границами из `rules.timeControl`. У
 * выключенных часов значения не проверяются: поля скрыты, а значения остаются
 * для повторного включения.
 */
function timeControlSchema(rules: GameRulesDto) {
  const {optional, baseSeconds, incrementSeconds} = rules.timeControl;
  return z
    .object({
      enabled: z
        .boolean()
        .refine(enabled => optional || enabled, 'Игра идёт только с часами'),
      baseSeconds: numberInput,
      incrementSeconds: numberInput,
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
    });
}

const UNSUPPORTED_VARIANT = 'Этот вариант игра не поддерживает';

/**
 * Simple-настройки: union по `gameCode` из сгенерированных схем, вариант игры
 * комнаты дополнен её границами. Остальные варианты union — без границ: форма
 * заполняется настройками своей игры.
 */
function simpleSchema(limits: GameSettingsLimitsDto) {
  const nothing =
    limits.gameCode === 'nothing'
      ? NothingSimpleSettingsDto.extend({
          rounds: NothingSimpleSettingsDto.shape.rounds
            .min(limits.rounds.min)
            .max(limits.rounds.max),
        })
      : NothingSimpleSettingsDto;
  const checkers =
    limits.gameCode === 'checkers'
      ? CheckersSimpleSettingsDto.extend({
          variant: CheckersSimpleSettingsDto.shape.variant.refine(
            variant => limits.variants.includes(variant),
            UNSUPPORTED_VARIANT,
          ),
        })
      : CheckersSimpleSettingsDto;
  return z.discriminatedUnion('gameCode', [nothing, checkers]);
}

/** Advanced-настройки: как simple, плюс часы с границами игры. */
function advancedSchema(rules: GameRulesDto) {
  const limits = rules.gameSettingsLimits;
  const timeControl = timeControlSchema(rules);
  const nothing = NothingAdvancedSettingsDto.extend({
    rounds:
      limits.gameCode === 'nothing'
        ? NothingAdvancedSettingsDto.shape.rounds
            .min(limits.rounds.min)
            .max(limits.rounds.max)
        : NothingAdvancedSettingsDto.shape.rounds,
    timeControl,
  });
  const checkers = CheckersAdvancedSettingsDto.extend({
    variant:
      limits.gameCode === 'checkers'
        ? CheckersAdvancedSettingsDto.shape.variant.refine(
            variant => limits.variants.includes(variant),
            UNSUPPORTED_VARIANT,
          )
        : CheckersAdvancedSettingsDto.shape.variant,
    timeControl,
  });
  return z.discriminatedUnion('gameCode', [nothing, checkers]);
}

/**
 * Схема формы настроек комнаты с границами из `rules` ответа
 * `GET /api/games/{gameCode}`: настройки комнаты, simple- и
 * advanced-настройки игры. Режим формы — advanced, если `advanced` не null
 * (галочка «Продвинутые правила»), иначе simple.
 */
export function roomSettingsSchema(rules: GameRulesDto) {
  const {spectators} = rules;
  return z.object({
    room: RoomOptionsDto.extend({
      maxSpectators: RoomOptionsDto.shape.maxSpectators
        .min(spectators.min)
        .max(spectators.max),
    }),
    simple: simpleSchema(rules.gameSettingsLimits).nullable(),
    advanced: advancedSchema(rules).nullable(),
  });
}

export type RoomSettingsValues = z.infer<ReturnType<typeof roomSettingsSchema>>;

/**
 * Поля формы, которые подсвечиваются по `VALIDATION_ERROR`. Имена совпадают с
 * полями тела `PUT …/settings`.
 */
export const ROOM_SETTINGS_FIELDS = [
  'room.maxSpectators',
  'simple.rounds',
  'simple.variant',
  'simple.time',
  'advanced.rounds',
  'advanced.variant',
  'advanced.timeControl.enabled',
  'advanced.timeControl.baseSeconds',
  'advanced.timeControl.incrementSeconds',
] as const satisfies readonly Path<RoomSettingsValues>[];

/** Simple-настройки по умолчанию у игры: с ними создаётся комната. */
export function defaultSimple(
  rules: GameRulesDto,
): GameSimpleSettingsDto | null {
  return rules.defaultSettings.simple ?? null;
}

/**
 * Значения формы из настроек комнаты. В advanced-режиме simple-поля
 * заполняются simple по умолчанию — на случай выключения продвинутых правил.
 */
export function toRoomSettingsValues(
  settings: RoomSettingsDto,
  rules: GameRulesDto,
): RoomSettingsValues {
  const simple = settings.simple ?? null;
  return {
    room: settings.room,
    simple: simple ?? defaultSimple(rules),
    advanced: simple === null ? settings.advanced : null,
  };
}

/**
 * Тело `PUT …/settings`: настройки комнаты и группа текущего режима. Во
 * время партии simple и advanced не меняются — уходит только комната.
 */
export function toRoomSettingsRequest(
  values: RoomSettingsValues,
  inGame: boolean,
): UpdateRoomSettingsRequest {
  if (inGame) {
    return {room: values.room};
  }
  if (values.advanced !== null) {
    return {room: values.room, advanced: values.advanced};
  }
  return values.simple === null
    ? {room: values.room}
    : {room: values.room, simple: values.simple};
}
