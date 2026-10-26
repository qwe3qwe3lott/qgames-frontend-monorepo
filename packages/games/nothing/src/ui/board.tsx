import {
  activeTimer,
  currentPlayerId,
  isSessionOver,
  moveOptionsOf,
  playerClock,
  type MoveOption,
} from '@qgames/game-core';
import {
  ChessClock,
  ClockIncrement,
} from '@qgames/game-ui/components/chess-clock';
import {GameOver} from '@qgames/game-ui/components/game-over';
import {
  PlayerList,
  type PlayerListItem,
} from '@qgames/game-ui/components/player-list';
import {TurnIndicator} from '@qgames/game-ui/components/turn-indicator';
import {Button} from '@qgames/ui/components/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@qgames/ui/components/tooltip';

import {isNothingSession, PASS} from '../state';
import type {BoardMove, BoardPlayer, BoardProps} from '../types';

const UNKNOWN_PLAYER_NAME = 'Игрок';
const PAUSED_HINT = 'Партия на паузе';

/** Вариант хода из состояния — в ход для отправки. */
function toMove(option: MoveOption): BoardMove {
  return option.data === undefined || option.data === null
    ? {type: option.type}
    : {type: option.type, data: option.data};
}

/**
 * Доска «Игры в ничто»: игроки по очереди завершают ход, N раундов; при
 * таймере — шахматные часы игроков. Правила не знает: доступность хода — из
 * `moveOptions` игрока в состоянии.
 */
export function Board({
  session,
  players,
  viewerId,
  onMove,
  movePending,
  moveError,
}: BoardProps) {
  if (!isNothingSession(session)) {
    return (
      <p className="text-destructive">Не удалось прочитать состояние партии</p>
    );
  }
  const {state} = session;
  const {round, rounds} = state.turns;
  const byId = new Map(players.map(player => [player.id, player]));
  const sessionPlayers: BoardPlayer[] = state.players.map(
    ({id}) => byId.get(id) ?? {id, name: UNKNOWN_PLAYER_NAME, avatar: null},
  );
  const currentId = currentPlayerId(state.turns);
  const current = currentId === null ? undefined : byId.get(currentId);

  if (isSessionOver(session)) {
    const cancelled = session.status === 'CANCELLED';
    return (
      <div className="flex flex-col gap-4">
        <GameOver
          title={cancelled ? 'Партия отменена' : 'Игра окончена'}
          description={
            cancelled
              ? undefined
              : `Сыграно раундов: ${String(rounds ?? round)}. В этой игре не бывает победителей.`
          }
        />
        <PlayerList players={sessionPlayers} title="Участники партии" />
      </div>
    );
  }

  const timer = activeTimer(session);
  const paused = timer?.paused ?? false;
  // Часы — в строке каждого игрока: идут только у ходящего.
  const playerItems: PlayerListItem[] = sessionPlayers.map(player => {
    const clock =
      timer === null ? null : playerClock(timer, player.id, currentId);
    return clock === null
      ? player
      : {
          ...player,
          extra: (
            <ChessClock clock={clock} clockOffsetMs={session.clockOffsetMs} />
          ),
        };
  });
  const pass = moveOptionsOf(state, viewerId).find(
    option => option.type === PASS,
  );
  const passButton = (
    <Button
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TurnIndicator
          round={round}
          totalRounds={rounds ?? undefined}
          playerName={current?.name ?? UNKNOWN_PLAYER_NAME}
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
            <ClockIncrement seconds={timer.incrementSeconds} />
          )}
        </div>
      </div>
      <PlayerList
        players={playerItems}
        activePlayerId={currentId}
        title="Порядок ходов"
      />
      <div className="flex items-center gap-3">
        {paused ? (
          // Заблокированная кнопка не получает событий мыши: триггер — обёртка.
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex" tabIndex={0}>
                {passButton}
              </span>
            </TooltipTrigger>
            <TooltipContent>{PAUSED_HINT}</TooltipContent>
          </Tooltip>
        ) : (
          passButton
        )}
        {paused || pass !== undefined ? null : (
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
