import {
  activeTimer,
  isSessionOver,
  moveOptionsOf,
  type MoveOption,
} from '@qgames/game-core';
import {GameOver} from '@qgames/game-ui/components/GameOver';
import {TurnIndicator} from '@qgames/game-ui/components/TurnIndicator';
import {Button} from '@qgames/ui/components/Button';
import {WithHint} from '@qgames/ui/components/WithHint';

import {isNothingSession, PASS} from '../state';
import type {BoardMove, BoardProps} from '../types';
import {testIds} from './Board.testIds';

const UNKNOWN_PLAYER_NAME = 'Игрок';
const PAUSED_HINT = 'Партия на паузе';

/** Вариант хода из состояния — в ход для отправки. */
function toMove(option: MoveOption): BoardMove {
  return option.data === undefined || option.data === null
    ? {type: option.type}
    : {type: option.type, data: option.data};
}

/**
 * Доска «Игры в ничто»: игроки по очереди завершают ход, N раундов; часы
 * игроков — в их карточках (`PlayerCard`). Правила не знает: доступность хода — из
 * `moveOptions` игрока в состоянии.
 */
export function Board({
  session,
  players,
  viewerId,
  onMove,
  movePending,
}: BoardProps) {
  if (!isNothingSession(session)) {
    return (
      <p className="text-destructive">Не удалось прочитать состояние партии</p>
    );
  }
  const {state} = session;
  const {round, rounds} = state.turns;
  const byId = new Map(players.map(player => [player.id, player]));
  const currentId = state.turns.currentPlayerId ?? null;
  const current = currentId === null ? undefined : byId.get(currentId);

  if (isSessionOver(session)) {
    const cancelled = session.status === 'CANCELLED';
    return (
      <div className="flex flex-col gap-4" data-testid={testIds.root}>
        <GameOver
          title={cancelled ? 'Партия отменена' : 'Игра окончена'}
          description={
            cancelled
              ? undefined
              : `Сыграно раундов: ${String(rounds ?? round)}. В этой игре не бывает победителей.`
          }
        />
      </div>
    );
  }

  const timer = activeTimer(session);
  const paused = timer?.paused ?? false;
  const pass = moveOptionsOf(state, viewerId).find(
    option => option.type === PASS,
  );
  const passButton = (
    <Button
      data-testid={testIds.passButton}
      disabled={paused || pass === undefined || movePending}
      onClick={() => {
        if (pass !== undefined) {
          onMove(toMove(pass));
        }
      }}
    >
      Завершить ход
    </Button>
  );
  return (
    <div className="flex flex-col gap-4" data-testid={testIds.root}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TurnIndicator
          round={round}
          totalRounds={rounds ?? undefined}
          playerName={current?.name ?? UNKNOWN_PLAYER_NAME}
        />
        {paused ? (
          <span
            role="status"
            className="rounded-md bg-muted px-2 py-1 text-sm font-medium text-muted-foreground"
          >
            Пауза
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <WithHint hint={paused ? PAUSED_HINT : null}>{passButton}</WithHint>
        {paused || pass !== undefined ? null : (
          <span className="text-sm text-muted-foreground">
            Ждём хода другого игрока
          </span>
        )}
      </div>
    </div>
  );
}
