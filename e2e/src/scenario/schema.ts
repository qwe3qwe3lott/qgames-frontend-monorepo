import {
  GameAdvancedSettingsDto,
  GameSimpleSettingsDto,
  RoomOptionsDto,
} from '@qgames/api/portal/zod';
import {z} from 'zod';

/** Кадр потока партии после подстановок: `event:` и JSON из `data:`. */
export const frameSchema = z.strictObject({
  type: z.string(),
  data: z.unknown(),
});

export type Frame = z.infer<typeof frameSchema>;

/** Ожидаемые кадры по имени актора. */
const expectedSchema = z.record(z.string(), z.array(frameSchema));

export type ExpectedFrames = z.infer<typeof expectedSchema>;

const actorSchema = z.strictObject({
  /** Имя в шагах и подстановках (`{{white.id}}`). */
  name: z.string().regex(/^[a-z][a-zA-Z0-9]*$/),
  role: z.enum(['PLAYER', 'SPECTATOR']),
});

const stepSchema = z.strictObject({
  title: z.string().min(1),
  /** Кто ходит. */
  actor: z.string(),
  /** Ход в формате драйвера игры. */
  move: z.unknown(),
  /** Кадры, которые получает каждый актор после хода; пишет режим записи. */
  expected: expectedSchema.optional(),
});

/**
 * Настройки комнаты, которые владелец выставляет кликами до входа остальных:
 * группы целиком, как в PUT настроек (схемы контракта). simple и advanced —
 * взаимоисключающие режимы.
 */
const settingsSchema = z
  .strictObject({
    room: RoomOptionsDto.optional(),
    simple: GameSimpleSettingsDto.optional(),
    advanced: GameAdvancedSettingsDto.optional(),
  })
  .refine(
    settings =>
      settings.simple === undefined || settings.advanced === undefined,
    {
      message: 'simple и advanced вместе не задаются',
    },
  );

/**
 * Сценарий партии. Порядок `actors` — порядок входа в комнату, он задаёт
 * места; первый актор создаёт комнату и начинает партию.
 */
export const scenarioSchema = z
  .strictObject({
    game: z.string(),
    /** Seed партии (заголовок X-Qgames-Seed): цвета, раздачи. */
    seed: z.int(),
    /** Настройки комнаты; без них — настройки игры по умолчанию. */
    settings: settingsSchema.optional(),
    actors: z.array(actorSchema).min(1),
    /** Кадры при старте партии (снапшот). */
    start: z.strictObject({expected: expectedSchema.optional()}).optional(),
    steps: z.array(stepSchema),
  })
  .refine(
    scenario =>
      [scenario.settings?.simple, scenario.settings?.advanced].every(
        group => group === undefined || group.gameCode === scenario.game,
      ),
    {message: 'Код игры в settings не совпадает с game'},
  );

export type Scenario = z.infer<typeof scenarioSchema>;
export type ScenarioStep = z.infer<typeof stepSchema>;
