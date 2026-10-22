import type {
  GameRulesDto,
  GameSettingsLimitsDto,
  RoomSettingsDto,
} from '@qgames/api/gateway/model';
import {
  CheckersSettingsDto,
  NothingSettingsDto,
  UpdateRoomSettingsBody,
} from '@qgames/api/gateway/zod';
import type {Path} from 'react-hook-form';
import {z} from 'zod';

/** Время на ход, которое форма предлагает при включении таймера. */
const DEFAULT_MOVE_SECONDS = 30;

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

/**
 * Схема формы настроек комнаты: сгенерированная схема `RoomSettingsDto`,
 * дополненная границами игры из `rules` ответа `GET /api/games/{gameCode}`.
 */
export function roomSettingsSchema(rules: GameRulesDto) {
  const {modes, moveSeconds} = rules.timeControl;
  const body = UpdateRoomSettingsBody.shape;
  return z.object({
    timeControl: z
      .object({
        mode: body.timeControl.shape.mode.refine(
          mode => modes.includes(mode),
          'Этот режим игра не поддерживает',
        ),
        // Поле видно только при PER_MOVE, поэтому проверяется ниже по режиму:
        // пустое значение (NaN из valueAsNumber) при NONE не мешает отправке.
        moveSeconds: z.number().or(z.nan()),
      })
      .superRefine((value, ctx) => {
        const seconds = value.moveSeconds;
        if (
          value.mode === 'PER_MOVE' &&
          (!Number.isInteger(seconds) ||
            seconds < moveSeconds.min ||
            seconds > moveSeconds.max)
        ) {
          ctx.addIssue({
            code: 'custom',
            path: ['moveSeconds'],
            message: `Введите целое число от ${String(moveSeconds.min)} до ${String(moveSeconds.max)}`,
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
  'timeControl.mode',
  'timeControl.moveSeconds',
  'gameSettings.rounds',
  'gameSettings.variant',
] as const satisfies readonly Path<RoomSettingsValues>[];

/** Значения формы из настроек комнаты (или настроек игры по умолчанию). */
export function toRoomSettingsValues(
  settings: RoomSettingsDto,
  rules: GameRulesDto,
): RoomSettingsValues {
  const {min, max} = rules.timeControl.moveSeconds;
  return {
    timeControl: {
      mode: settings.timeControl.mode,
      moveSeconds:
        settings.timeControl.moveSeconds ??
        Math.min(Math.max(DEFAULT_MOVE_SECONDS, min), max),
    },
    gameSettings: settings.gameSettings,
  };
}

/** Тело запроса из значений формы: `moveSeconds` только при PER_MOVE. */
export function toRoomSettings(values: RoomSettingsValues): RoomSettingsDto {
  const {mode, moveSeconds} = values.timeControl;
  return {
    timeControl: {
      mode,
      moveSeconds: mode === 'PER_MOVE' ? moveSeconds : null,
    },
    gameSettings: values.gameSettings,
  };
}
