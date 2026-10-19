import {z} from 'zod';

/** Ход единственного типа: «Завершить ход». */
export const PASS_MOVE = {type: 'PASS'} as const;

/** Состояние партии для зрителя (`NothingView` на бэкенде). */
export const nothingViewSchema = z.object({
  players: z.array(z.uuid()),
  round: z.number().int().positive(),
  rounds: z.number().int().positive(),
  currentPlayer: z.uuid().nullable(),
  finished: z.boolean(),
});

export type NothingView = z.infer<typeof nothingViewSchema>;
