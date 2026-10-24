// Подсказки ввода хода по флагам `meta.moveRules`. Варианты правил (RUSSIAN…)
// фронт не знает — только флаги с бэкенда. Состояние не симулируется: функции
// лишь перечисляют пути, которые сервер должен принять; последнее слово за ним
// (422 MOVE_REJECTED, ILLEGAL_MOVE). Логика повторяет генератор ходов бэкенда
// (`CheckersBoard`).

import type {CheckersPieceDtoOutput} from '@qgames/api/portal/zod';

import type {CheckersColor, CheckersMoveRules} from '../state';

/** Клетка `[x, y]`, отсчёт с 1; `[1, 1]` — тёмная клетка в углу белых. */
export type Square = readonly [x: number, y: number];

export type CheckersPiece = CheckersPieceDtoOutput;

/** Выбор игрока: шашка и уже набранный путь (с начальной клеткой). */
export interface PathSelection {
  pieceId: string;
  path: readonly Square[];
}

/** Подсказка к выбору: куда можно шагнуть дальше и завершён ли путь. */
export interface NextSquares {
  next: readonly Square[];
  /** Путь — целый допустимый ход: его можно отправлять. */
  complete: boolean;
}

/** Шашки, которыми можно ходить, и обязательно ли сейчас взятие. */
export interface MovablePieces {
  pieceIds: ReadonlySet<string>;
  /** Ходы только со взятием (обязательное взятие). */
  capture: boolean;
}

interface Direction {
  dx: number;
  dy: number;
}

const ALL_DIRECTIONS: readonly Direction[] = [
  {dx: 1, dy: 1},
  {dx: -1, dy: 1},
  {dx: 1, dy: -1},
  {dx: -1, dy: -1},
];

/** Допустимый ход: шашка, полный путь и число сбитых. */
interface LegalPath {
  pieceId: string;
  path: readonly Square[];
  captured: number;
}

export function sameSquare(a: Square, b: Square): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

function squareKey([x, y]: Square): string {
  return `${String(x)},${String(y)}`;
}

/**
 * Клетка шашки. Схема контракта проверяет `square` как массив ровно из двух
 * чисел, поэтому значения по умолчанию не используются.
 */
export function pieceSquare(piece: CheckersPiece): Square {
  const [x = 0, y = 0] = piece.square;
  return [x, y];
}

function step([x, y]: Square, {dx, dy}: Direction): Square {
  return [x + dx, y + dy];
}

/** Генератор ходов по флагам правил для одной позиции. */
class MoveGenerator {
  private readonly rules: CheckersMoveRules;
  private readonly pieces: readonly CheckersPiece[];
  private readonly bySquare: ReadonlyMap<string, CheckersPiece>;

  constructor(rules: CheckersMoveRules, pieces: readonly CheckersPiece[]) {
    this.rules = rules;
    this.pieces = pieces;
    this.bySquare = new Map(
      pieces.map(piece => [squareKey(pieceSquare(piece)), piece]),
    );
  }

  /** Все допустимые ходы стороны с учётом обязательного и максимального взятия. */
  legalPaths(color: CheckersColor): LegalPath[] {
    const own = this.pieces.filter(piece => piece.color === color);
    const captures = own.flatMap(piece => this.captures(piece));
    let allowed = captures;
    if (this.rules.maxCaptureRequired && captures.length > 0) {
      const max = Math.max(...captures.map(move => move.captured));
      allowed = captures.filter(move => move.captured === max);
    }
    if (this.rules.captureRequired && allowed.length > 0) {
      return allowed;
    }
    return [...allowed, ...own.flatMap(piece => this.quietMoves(piece))];
  }

  private quietMoves(piece: CheckersPiece): LegalPath[] {
    const from = pieceSquare(piece);
    const king = piece.kind === 'KING';
    const directions =
      king || this.rules.menMoveBackward
        ? ALL_DIRECTIONS
        : this.forward(piece.color);
    const result: LegalPath[] = [];
    for (const direction of directions) {
      let to = step(from, direction);
      while (this.inside(to) && !this.bySquare.has(squareKey(to))) {
        result.push({pieceId: piece.id, path: [from, to], captured: 0});
        if (!king || !this.rules.flyingKings) {
          break;
        }
        to = step(to, direction);
      }
    }
    return result;
  }

  private captures(piece: CheckersPiece): LegalPath[] {
    const origin = pieceSquare(piece);
    const result: LegalPath[] = [];

    const continueFrom = (
      at: Square,
      king: boolean,
      path: readonly Square[],
      captured: ReadonlySet<string>,
    ): void => {
      for (const jump of this.jumps(piece.color, origin, at, king, captured)) {
        const taken = new Set(captured).add(jump.victimId);
        const landings = jump.landings.map(square => {
          const kingAfter =
            king ||
            (this.rules.promoteMidCapture &&
              square[1] === this.lastRow(piece.color));
          return {
            square,
            king: kingAfter,
            canContinue:
              this.jumps(piece.color, origin, square, kingAfter, taken).length >
              0,
          };
        });
        // Если с какой-то клетки бой продолжается, остановиться на другой нельзя.
        const continuing = landings.filter(landing => landing.canContinue);
        for (const landing of continuing.length > 0 ? continuing : landings) {
          const next = [...path, landing.square];
          if (landing.canContinue) {
            continueFrom(landing.square, landing.king, next, taken);
          } else {
            result.push({pieceId: piece.id, path: next, captured: taken.size});
          }
        }
      }
    };

    continueFrom(origin, piece.kind === 'KING', [origin], new Set());
    return result;
  }

  /** Прыжки из `at`: какая шашка соперника бьётся и куда можно встать за ней. */
  private jumps(
    color: CheckersColor,
    origin: Square,
    at: Square,
    king: boolean,
    captured: ReadonlySet<string>,
  ): {victimId: string; landings: Square[]}[] {
    const flying = king && this.rules.flyingKings;
    const directions =
      king || this.rules.menCaptureBackward
        ? ALL_DIRECTIONS
        : this.forward(color);
    const result: {victimId: string; landings: Square[]}[] = [];
    for (const direction of directions) {
      let over = step(at, direction);
      if (flying) {
        while (this.inside(over) && this.isFree(over, origin, captured)) {
          over = step(over, direction);
        }
      }
      if (!this.inside(over) || this.isFree(over, origin, captured)) {
        continue;
      }
      const victim = this.bySquare.get(squareKey(over));
      if (
        victim === undefined ||
        victim.color === color ||
        captured.has(victim.id)
      ) {
        continue;
      }
      const landings: Square[] = [];
      let landing = step(over, direction);
      while (this.inside(landing) && this.isFree(landing, origin, captured)) {
        landings.push(landing);
        if (!flying) {
          break;
        }
        landing = step(landing, direction);
      }
      if (landings.length > 0) {
        result.push({victimId: victim.id, landings});
      }
    }
    return result;
  }

  /**
   * Свободна ли клетка во время хода: начальная клетка шашки уже свободна,
   * сбитые освобождают клетку сразу только без турецкого удара.
   */
  private isFree(
    square: Square,
    origin: Square,
    captured: ReadonlySet<string>,
  ): boolean {
    if (sameSquare(square, origin)) {
      return true;
    }
    const occupant = this.bySquare.get(squareKey(square));
    if (occupant === undefined) {
      return true;
    }
    return !this.rules.removeCapturedAfterMove && captured.has(occupant.id);
  }

  private inside([x, y]: Square): boolean {
    const size = this.rules.boardSize;
    return x >= 1 && x <= size && y >= 1 && y <= size;
  }

  private forward(color: CheckersColor): readonly Direction[] {
    const dy = color === 'WHITE' ? 1 : -1;
    return [
      {dx: 1, dy},
      {dx: -1, dy},
    ];
  }

  private lastRow(color: CheckersColor): number {
    return color === 'WHITE' ? this.rules.boardSize : 1;
  }
}

/** Шашки стороны `color`, которыми можно ходить (с учётом обязательного взятия). */
export function movablePieces(
  pieces: readonly CheckersPiece[],
  rules: CheckersMoveRules,
  color: CheckersColor,
): MovablePieces {
  const paths = new MoveGenerator(rules, pieces).legalPaths(color);
  return {
    pieceIds: new Set(paths.map(move => move.pieceId)),
    capture: paths.some(move => move.captured > 0),
  };
}

function startsWith(path: readonly Square[], prefix: readonly Square[]) {
  return (
    prefix.length <= path.length &&
    prefix.every((square, i) => {
      const other = path[i];
      return other !== undefined && sameSquare(square, other);
    })
  );
}

/**
 * Следующие клетки пути выбранной шашки и признак «путь завершён» — по флагам
 * `moveRules`. Пустой `next` без `complete` — выбор не ведёт ни к одному ходу.
 */
export function nextSquares(
  pieces: readonly CheckersPiece[],
  rules: CheckersMoveRules,
  color: CheckersColor,
  selection: PathSelection,
): NextSquares {
  const depth = selection.path.length;
  const candidates = new MoveGenerator(rules, pieces)
    .legalPaths(color)
    .filter(
      move =>
        move.pieceId === selection.pieceId &&
        startsWith(move.path, selection.path),
    );
  const next: Square[] = [];
  let complete = false;
  for (const {path} of candidates) {
    const square = path[depth];
    if (square === undefined) {
      complete = true;
    } else if (!next.some(other => sameSquare(other, square))) {
      next.push(square);
    }
  }
  return {next, complete};
}
