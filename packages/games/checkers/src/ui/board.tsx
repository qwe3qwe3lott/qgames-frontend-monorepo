import {
  activeTimer,
  currentPlayerId,
  isSessionOver,
  moveOptionsOf,
  sessionResult,
} from '@qgames/game-core';
import {
  GameOver,
  type GameOverResult,
} from '@qgames/game-ui/components/game-over';
import {
  PlayerList,
  type PlayerListItem,
} from '@qgames/game-ui/components/player-list';
import {TurnIndicator} from '@qgames/game-ui/components/turn-indicator';
import {TurnTimer} from '@qgames/game-ui/components/turn-timer';
import {Button} from '@qgames/ui/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@qgames/ui/components/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@qgames/ui/components/tooltip';
import {useState, type ReactNode} from 'react';

import {COLOR_LABELS, reasonLabel} from '../lib/labels';
import {
  movablePieces,
  nextSquares,
  pieceSquare,
  sameSquare,
  type Square,
} from '../lib/path';
import {isCheckersSession, MOVE, RESIGN, type CheckersSession} from '../state';
import type {BoardPlayer, BoardProps} from '../types';
import {CheckersGrid} from './checkers-grid';

const UNKNOWN_PLAYER_NAME = 'Игрок';
const PAUSED_HINT = 'Партия на паузе';

/** Клетки из контракта (`[x, y]`, ровно два числа по схеме) — в пару. */
function toSquare(square: readonly number[]): Square {
  const [x = 0, y = 0] = square;
  return [x, y];
}

/**
 * Набранный путь. `seq` — партия, на которой он набран: после любого события
 * журнала выбор сбрасывается. `sent` — путь отправлен: когда ход перестал быть
 * в работе (принят и пришёл в потоке или отклонён), выбор сбрасывается.
 */
interface Selection {
  seq: number;
  pieceId: string;
  path: readonly Square[];
  sent: boolean;
}

/** Подсказка к заблокированному элементу: триггер — обёртка, disabled-кнопка событий не получает. */
function WithTooltip({
  hint,
  children,
}: {
  hint: string | null;
  children: ReactNode;
}) {
  if (hint === null) {
    return children;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex" tabIndex={0}>
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}

function ResignButton({
  disabled,
  hint,
  onResign,
}: {
  disabled: boolean;
  hint: string | null;
  onResign: () => void;
}) {
  return (
    <Dialog>
      <WithTooltip hint={hint}>
        <DialogTrigger asChild>
          <Button variant="outline" disabled={disabled}>
            Сдаться
          </Button>
        </DialogTrigger>
      </WithTooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Сдаться?</DialogTitle>
          <DialogDescription>
            Партия закончится, победа достанется сопернику.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Отмена
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="button" variant="destructive" onClick={onResign}>
              Сдаться
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CheckersBoardProps extends Omit<BoardProps, 'session'> {
  session: CheckersSession;
}

function CheckersBoard({
  session,
  players,
  viewerId,
  onMove,
  movePending,
  moveError,
}: CheckersBoardProps) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const {state} = session;
  const rules = session.meta.moveRules;
  const byId = new Map(players.map(player => [player.id, player]));
  const nameOf = (id: string): string =>
    byId.get(id)?.name ?? UNKNOWN_PLAYER_NAME;
  const playerItems: PlayerListItem[] = state.players.map(({id, color}) => {
    const player: BoardPlayer = byId.get(id) ?? {
      id,
      name: UNKNOWN_PLAYER_NAME,
      avatar: null,
    };
    return {...player, badges: [COLOR_LABELS[color]]};
  });
  const viewerColor =
    state.players.find(player => player.id === viewerId)?.color ?? null;
  const lastMovePath = (state.lastMove?.path ?? []).map(toSquare);
  const over = isSessionOver(session);

  const timer = activeTimer(session);
  const paused = timer?.paused ?? false;
  const options = moveOptionsOf(state, viewerId);
  const canMove =
    !over &&
    !paused &&
    !movePending &&
    viewerColor !== null &&
    options.some(option => option.type === MOVE);
  const movable = canMove
    ? movablePieces(state.pieces, rules, viewerColor)
    : {pieceIds: new Set<string>(), capture: false};

  // Выбор действует только на той партии, где набран, и пока отправленный ход в работе.
  const current =
    selection !== null &&
    selection.seq === session.seq &&
    !(selection.sent && !movePending) &&
    (canMove || selection.sent)
      ? selection
      : null;
  const hints =
    current === null || current.sent || viewerColor === null
      ? {next: [], complete: false}
      : nextSquares(state.pieces, rules, viewerColor, current);

  const select = (pieceId: string, from: Square) => {
    setSelection({seq: session.seq, pieceId, path: [from], sent: false});
  };

  const onSquareClick = (square: Square) => {
    if (!canMove) {
      return;
    }
    if (current !== null && hints.next.some(next => sameSquare(next, square))) {
      const path = [...current.path, square];
      const after = nextSquares(state.pieces, rules, viewerColor, {
        pieceId: current.pieceId,
        path,
      });
      const done = after.complete && after.next.length === 0;
      setSelection({...current, path, sent: done});
      if (done) {
        onMove({type: MOVE, data: {path: path.map(([x, y]) => [x, y])}});
      }
      return;
    }
    const piece = state.pieces.find(item =>
      sameSquare(pieceSquare(item), square),
    );
    if (piece !== undefined && movable.pieceIds.has(piece.id)) {
      select(piece.id, square);
      return;
    }
    setSelection(null);
  };

  const grid = (
    <CheckersGrid
      boardSize={rules.boardSize}
      pieces={state.pieces}
      bottomColor={viewerColor ?? 'WHITE'}
      lastMovePath={lastMovePath}
      movableIds={movable.pieceIds}
      mustCapture={movable.capture}
      selectedPath={current?.path ?? []}
      selectedId={current?.pieceId ?? null}
      nextSquares={hints.next}
      interactive={canMove}
      onSquareClick={onSquareClick}
    />
  );

  if (over) {
    const cancelled = session.status === 'CANCELLED';
    const result = sessionResult(state);
    const gameResult: GameOverResult | undefined =
      result === null
        ? undefined
        : result.outcome === 'DRAW'
          ? {outcome: 'DRAW'}
          : {outcome: 'WIN', winnerNames: result.winnerIds.map(nameOf)};
    return (
      <div className="flex flex-col gap-4">
        <GameOver
          title={cancelled ? 'Партия отменена' : 'Игра окончена'}
          result={cancelled ? undefined : gameResult}
          description={
            cancelled || result === null
              ? undefined
              : reasonLabel(result.reason)
          }
        />
        {grid}
        <PlayerList players={playerItems} title="Участники партии" />
      </div>
    );
  }

  const currentId = currentPlayerId(state.turns);
  const canResign = options.some(option => option.type === RESIGN);
  const myTurn = options.some(option => option.type === MOVE);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TurnIndicator
          playerName={
            currentId === null ? UNKNOWN_PLAYER_NAME : nameOf(currentId)
          }
        />
        <div className="flex items-center gap-2">
          {paused ? (
            <span
              role="status"
              className="rounded-md bg-muted px-2 py-1 text-sm font-medium text-muted-foreground"
            >
              Пауза
            </span>
          ) : null}
          {timer === null ? null : (
            <TurnTimer timer={timer} clockOffsetMs={session.clockOffsetMs} />
          )}
        </div>
      </div>
      {grid}
      <div className="flex flex-wrap items-center gap-3">
        {canResign ? (
          <ResignButton
            disabled={paused || movePending}
            hint={paused ? PAUSED_HINT : null}
            onResign={() => {
              onMove({type: RESIGN});
            }}
          />
        ) : null}
        {viewerColor === null ? null : (
          <span className="text-sm text-muted-foreground">
            {paused
              ? PAUSED_HINT
              : myTurn
                ? movable.capture
                  ? 'Ваш ход: взятие обязательно'
                  : 'Ваш ход'
                : 'Ждём хода соперника'}
          </span>
        )}
      </div>
      {moveError === null ? null : (
        <p className="text-sm text-destructive">{moveError}</p>
      )}
      <PlayerList
        players={playerItems}
        activePlayerId={currentId}
        title="Игроки"
      />
    </div>
  );
}

/**
 * Доска шашек. Правила знает сервер: варианты действий — из `moveOptions`
 * игрока, путь собирается по подсказкам из флагов `meta.moveRules` и
 * отправляется целиком (`{type: MOVE, data: {path}}`).
 */
export function Board({session, ...props}: BoardProps) {
  if (!isCheckersSession(session)) {
    return (
      <p className="text-destructive">Не удалось прочитать состояние партии</p>
    );
  }
  return <CheckersBoard session={session} {...props} />;
}
