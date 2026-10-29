import {cn} from '@qgames/ui/lib/utils';
import {Crown} from 'lucide-react';

import {COLOR_LABELS, squareName} from '../lib/labels';
import {
  pieceSquare,
  sameSquare,
  type CheckersPiece,
  type Square,
} from '../lib/path';
import type {CheckersColor} from '../state';
import {testIds} from './checkers-grid.test-ids';

export interface CheckersGridProps {
  boardSize: number;
  pieces: readonly CheckersPiece[];
  /** Чей цвет внизу доски: у чёрных доска перевёрнута. */
  bottomColor: CheckersColor;
  /** Клетки последнего хода (путь). */
  lastMovePath: readonly Square[];
  /** Шашки, которыми можно ходить; при обязательном взятии — подсвечены. */
  movableIds: ReadonlySet<string>;
  mustCapture: boolean;
  /** Набранный путь выбранной шашки (с начальной клеткой). */
  selectedPath: readonly Square[];
  selectedId: string | null;
  /** Куда можно шагнуть дальше. */
  nextSquares: readonly Square[];
  /** Ввод хода включён: тёмные клетки — кнопки. */
  interactive: boolean;
  onSquareClick: (square: Square) => void;
}

function range(from: number, to: number): number[] {
  const step = from <= to ? 1 : -1;
  const result: number[] = [];
  for (let i = from; i !== to + step; i += step) {
    result.push(i);
  }
  return result;
}

function includesSquare(list: readonly Square[], square: Square): boolean {
  return list.some(item => sameSquare(item, square));
}

function pieceLabel(piece: CheckersPiece): string {
  const kind = piece.kind === 'KING' ? 'дамка' : 'шашка';
  return `${COLOR_LABELS[piece.color]}, ${kind}`;
}

/** Доска шашек: клетки, шашки и подсветка пути. Правил не знает. */
export function CheckersGrid({
  boardSize,
  pieces,
  bottomColor,
  lastMovePath,
  movableIds,
  mustCapture,
  selectedPath,
  selectedId,
  nextSquares,
  interactive,
  onSquareClick,
}: CheckersGridProps) {
  const flipped = bottomColor === 'BLACK';
  const rows = flipped ? range(1, boardSize) : range(boardSize, 1);
  const columns = flipped ? range(boardSize, 1) : range(1, boardSize);
  const bySquare = new Map(
    pieces.map(piece => {
      const [x, y] = pieceSquare(piece);
      return [squareName(x, y), piece];
    }),
  );

  return (
    <div
      role="group"
      aria-label="Доска"
      data-testid={testIds.root}
      className="grid w-full max-w-[min(100%,32rem)] overflow-hidden rounded-md border"
      // Число столбцов приходит из правил партии — классом не выразить.
      style={{
        gridTemplateColumns: `repeat(${String(boardSize)}, minmax(0, 1fr))`,
      }}
    >
      {rows.map(y =>
        columns.map(x => {
          const square: Square = [x, y];
          const name = squareName(x, y);
          // [1, 1] — тёмная клетка: тёмные — с чётной суммой координат.
          const dark = (x + y) % 2 === 0;
          if (!dark) {
            return <div key={name} className="aspect-square bg-amber-100" />;
          }
          const piece = bySquare.get(name);
          const inPath = includesSquare(selectedPath, square);
          const isNext = includesSquare(nextSquares, square);
          const inLastMove = includesSquare(lastMovePath, square);
          const selected = piece?.id === selectedId;
          const highlightCapture =
            interactive &&
            mustCapture &&
            piece !== undefined &&
            movableIds.has(piece.id);
          const label = [
            name,
            piece === undefined ? null : pieceLabel(piece),
            isNext ? 'можно сходить' : null,
          ]
            .filter(part => part !== null)
            .join(', ');
          const cellClass = cn(
            'relative flex aspect-square items-center justify-center bg-amber-800',
            inLastMove && 'bg-amber-700',
            inPath && 'bg-sky-700',
          );
          // Координаты партии и шашка на клетке — для e2e (доска переворачивается).
          const squareData = {
            'data-testid': testIds.square,
            'data-x': x,
            'data-y': y,
            'data-piece-color': piece?.color,
            'data-piece-kind': piece?.kind,
          };
          const content = (
            <>
              {piece === undefined ? null : (
                <span
                  className={cn(
                    'flex size-4/5 items-center justify-center rounded-full border-2 shadow',
                    piece.color === 'WHITE'
                      ? 'border-neutral-300 bg-neutral-50 text-amber-700'
                      : 'border-neutral-700 bg-neutral-900 text-amber-400',
                    selected && 'ring-4 ring-sky-400',
                    highlightCapture && !selected && 'ring-4 ring-orange-400',
                  )}
                >
                  {piece.kind === 'KING' ? (
                    <Crown className="size-1/2" aria-hidden />
                  ) : null}
                </span>
              )}
              {isNext ? (
                <span
                  className="absolute size-1/3 rounded-full bg-sky-400/80"
                  aria-hidden
                />
              ) : null}
            </>
          );
          // Без ввода хода доска — картинка: клетки не кнопки.
          return interactive ? (
            <button
              key={name}
              type="button"
              aria-label={label}
              aria-pressed={selected || inPath}
              onClick={() => {
                onSquareClick(square);
              }}
              className={cellClass}
              {...squareData}
            >
              {content}
            </button>
          ) : (
            <div
              key={name}
              role="img"
              aria-label={label}
              className={cellClass}
              {...squareData}
            >
              {content}
            </div>
          );
        }),
      )}
    </div>
  );
}
