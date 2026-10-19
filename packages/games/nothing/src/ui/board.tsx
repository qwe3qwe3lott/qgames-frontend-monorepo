import {GameOver} from '@qgames/game-ui/components/game-over';
import {PlayerList} from '@qgames/game-ui/components/player-list';
import {TurnIndicator} from '@qgames/game-ui/components/turn-indicator';
import {Button} from '@qgames/ui/components/button';

import {nothingViewSchema, PASS_MOVE} from '../state';
import type {BoardPlayer, BoardProps} from '../types';

const UNKNOWN_PLAYER_NAME = 'Игрок';

/** Доска «Игры в ничто»: игроки по очереди завершают ход, N кругов. */
export function Board({
  session,
  players,
  viewerId,
  onMove,
  movePending,
  moveError,
}: BoardProps) {
  const parsed = nothingViewSchema.safeParse(session.state);
  if (!parsed.success) {
    return (
      <p className="text-destructive">Не удалось прочитать состояние партии</p>
    );
  }
  const view = parsed.data;
  const byId = new Map(players.map(player => [player.id, player]));
  const sessionPlayers: BoardPlayer[] = view.players.map(
    id => byId.get(id) ?? {id, name: UNKNOWN_PLAYER_NAME, avatar: null},
  );
  const current =
    view.currentPlayer === null ? undefined : byId.get(view.currentPlayer);

  if (view.finished || session.status !== 'IN_PROGRESS') {
    return (
      <div className="flex flex-col gap-4">
        <GameOver
          title={
            session.status === 'CANCELLED' ? 'Партия отменена' : 'Игра окончена'
          }
          description={
            session.status === 'CANCELLED'
              ? undefined
              : `Сыграно кругов: ${String(view.rounds)}. В этой игре не бывает победителей.`
          }
        />
        <PlayerList players={sessionPlayers} title="Участники партии" />
      </div>
    );
  }

  const myTurn = view.currentPlayer === viewerId;
  return (
    <div className="flex flex-col gap-4">
      <TurnIndicator
        round={view.round}
        totalRounds={view.rounds}
        playerName={current?.name ?? UNKNOWN_PLAYER_NAME}
      />
      <PlayerList
        players={sessionPlayers}
        activePlayerId={view.currentPlayer}
        title="Порядок ходов"
      />
      <div className="flex items-center gap-3">
        <Button
          disabled={!myTurn || movePending}
          onClick={() => {
            onMove(PASS_MOVE);
          }}
        >
          Завершить ход
        </Button>
        {myTurn ? null : (
          <span className="text-sm text-muted-foreground">
            Ждём хода другого игрока
          </span>
        )}
      </div>
      {moveError === null ? null : (
        <p className="text-sm text-destructive">{moveError}</p>
      )}
    </div>
  );
}
