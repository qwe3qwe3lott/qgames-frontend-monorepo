import {z} from 'zod';

import type {Actor} from '../portal/testPortal';

/**
 * Драйвер игры: переводит ход из файла сценария в клики по доске актора.
 * Ходы делаются только через UI.
 */
export interface GameDriver {
  move(actor: Actor, move: unknown): Promise<void>;
}

const checkersMoveSchema = z.union([
  z.object({
    /** Клетки пути в координатах партии: шашка, затем каждая клетка хода. */
    path: z.array(z.tuple([z.int(), z.int()])).min(2),
    offerDraw: z.boolean().optional(),
  }),
  z.object({resign: z.literal(true)}),
  z.object({acceptDraw: z.literal(true)}),
]);

const checkersDriver: GameDriver = {
  async move(actor, move) {
    const parsed = checkersMoveSchema.parse(move);
    const board = actor.checkersBoard;
    if ('path' in parsed) {
      if (parsed.offerDraw === true) {
        await board.offerDrawButton.click();
      }
      // Последняя клетка пути отправляет ход сама.
      for (const [x, y] of parsed.path) {
        await board.squareButton(x, y).click();
      }
    } else if ('resign' in parsed) {
      await board.resignButton.click();
      await board.resignConfirmButton.click();
    } else {
      await board.acceptDrawButton.click();
    }
  },
};

const nothingMoveSchema = z.object({pass: z.literal(true)});

const nothingDriver: GameDriver = {
  async move(actor, move) {
    nothingMoveSchema.parse(move);
    await actor.nothingBoard.passButton.click();
  },
};

/** Драйверы по коду игры. */
export const drivers: Readonly<Record<string, GameDriver>> = {
  checkers: checkersDriver,
  nothing: nothingDriver,
};
