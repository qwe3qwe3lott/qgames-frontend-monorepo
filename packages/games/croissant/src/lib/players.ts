import type {CroissantState} from '../state';
import {PALETTE} from './palette';

type PlacedTile = CroissantState['board'][number];

/** Цвет игрока на доске и в карточке: `players[].color` из состояния, назначает сервер. */
export function playerColors(
  state: CroissantState,
): ReadonlyMap<string, string> {
  return new Map(
    state.players.map(player => [
      player.id,
      PALETTE.confectioners[player.color],
    ]),
  );
}

/** Цвет игрока по id; игрока нет в состоянии — нейтральный. */
export function colorOf(
  colors: ReadonlyMap<string, string>,
  playerId: string,
): string {
  return colors.get(playerId) ?? PALETTE.unknownPlayer;
}

/**
 * Последний выложенный тайл: `board` дополняется в конец, стартовый тайл (без `playerId`) не считается. С `playerId` —
 * последний тайл этого игрока.
 */
export function lastPlacedTile(
  state: CroissantState,
  playerId?: string,
): PlacedTile | undefined {
  return state.board.findLast(tile =>
    playerId === undefined
      ? tile.playerId !== null && tile.playerId !== undefined
      : tile.playerId === playerId,
  );
}
