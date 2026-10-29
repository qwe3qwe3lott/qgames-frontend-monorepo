import {activeTimer, isSessionOver, playerClock} from '@qgames/game-core';
import {Clock} from '@qgames/game-ui/components/Clock';
import {PlayerCard as BasePlayerCard} from '@qgames/game-ui/components/PlayerCard';

import {COLOR_LABELS} from '../lib/labels';
import {isCheckersSession} from '../state';
import type {GamePlayerCardProps} from '../types';
import {testIds} from './PlayerCard.testIds';

/**
 * Карточка игрока шашек в списке игроков комнаты: цвет, подсветка ходящего,
 * часы и пометка о предложенной ничьей. Не участник партии — базовая карточка.
 */
export function PlayerCard({session, card}: GamePlayerCardProps) {
  if (!isCheckersSession(session)) {
    return <BasePlayerCard {...card} />;
  }
  const {state} = session;
  const player = state.players.find(item => item.id === card.id);
  if (player === undefined) {
    return <BasePlayerCard {...card} />;
  }
  const over = isSessionOver(session);
  const turnPlayerId = state.turns.currentPlayerId ?? null;
  const timer = activeTimer(session);
  // Часы идут только у ходящего.
  const clock =
    timer === null ? null : playerClock(timer, card.id, turnPlayerId);
  const offersDraw = !over && state.drawOfferedBy === card.id;
  return (
    <BasePlayerCard
      {...card}
      badges={[...(card.badges ?? []), COLOR_LABELS[player.color]]}
      active={!over && turnPlayerId === card.id}
      {...(offersDraw
        ? {
            note: (
              <span
                className="text-destructive"
                data-testid={testIds.drawOffer}
              >
                Предлагает ничью
              </span>
            ),
          }
        : {})}
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
