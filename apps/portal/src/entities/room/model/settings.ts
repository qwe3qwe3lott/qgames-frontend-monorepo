import type {
  GameInfoResponse,
  RoomSettingsDto,
} from '@qgames/api/gateway/model';
import {UpdateRoomSettingsBody} from '@qgames/api/gateway/zod';
import type {Path} from 'react-hook-form';
import {z} from 'zod';

/** Время на ход, которое форма предлагает при включении таймера. */
const DEFAULT_MOVE_SECONDS = 30;

/**
 * Схема формы настроек комнаты: сгенерированная схема `RoomSettingsDto`,
 * дополненная границами игры из `GET /api/games/{gameCode}`.
 *
 * `gameSettings` сейчас один вариант (NOTHING, `rounds`); со второй игрой
 * здесь появится выбор схемы по `gameType`.
 */
export function roomSettingsSchema(info: GameInfoResponse) {
  const {modes, moveSeconds} = info.timeControl;
  const {rounds} = info.gameSettingsLimits;
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
    gameSettings: body.gameSettings.extend({
      rounds: body.gameSettings.shape.rounds.min(rounds.min).max(rounds.max),
    }),
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
] as const satisfies readonly Path<RoomSettingsValues>[];

/** Значения формы из настроек комнаты (или настроек игры по умолчанию). */
export function toRoomSettingsValues(
  settings: RoomSettingsDto,
  info: GameInfoResponse,
): RoomSettingsValues {
  const {min, max} = info.timeControl.moveSeconds;
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
