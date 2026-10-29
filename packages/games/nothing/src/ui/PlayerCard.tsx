import {activeTimer, isSessionOver, playerClock} from '@qgames/game-core';
import {Clock} from '@qgames/game-ui/components/Clock';
import {PlayerCard as BasePlayerCard} from '@qgames/game-ui/components/PlayerCard';

import {isNothingSession} from '../state';
import type {GamePlayerCardProps} from '../types';

/**
 * Карточка игрока «Игры в ничто» в списке игроков комнаты: подсветка ходящего
 * и часы. Не участник партии — базовая карточка.
 */
export function PlayerCard({session, card}: GamePlayerCardProps) {
  if (
    !isNothingSession(session) ||
    !session.state.players.some(item => item.id === card.id)
  ) {
    return <BasePlayerCard {...card} />;
  }
  const currentId = session.state.turns.currentPlayerId ?? null;
  const timer = activeTimer(session);
  // Часы идут только у ходящего.
  const clock = timer === null ? null : playerClock(timer, card.id, currentId);
  return (
    <BasePlayerCard
      {...card}
      active={!isSessionOver(session) && currentId === card.id}
      {...(clock === null
        ? {}
        : {
            status: (
              <Clock clock={clock} clockOffsetMs={session.clockOffsetMs} />
            ),
          })}
    />
  );
}
