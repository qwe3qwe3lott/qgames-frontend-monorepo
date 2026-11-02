import {activeTimer, isSessionOver, playerClock} from '@qgames/game-core';
import {Clock} from '@qgames/game-ui/components/Clock';
import {PlayerCard as BasePlayerCard} from '@qgames/game-ui/components/PlayerCard';

import {isCroissantSession} from '../state';
import type {GamePlayerCardProps} from '../types';
import {testIds} from './PlayerCard.testIds';

/**
 * Карточка пекаря в списке игроков комнаты: «Золотые крошки», остаток кондитеров, подсветка ходящего и часы. Не участник
 * партии — базовая карточка.
 */
export function PlayerCard({session, card}: GamePlayerCardProps) {
  if (!isCroissantSession(session)) {
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
  const clock =
    timer === null ? null : playerClock(timer, card.id, turnPlayerId);

  return (
    <BasePlayerCard
      {...card}
      badges={[...(card.badges ?? []), `${String(player.crumbs)} крошек`]}
      active={!over && turnPlayerId === card.id}
      note={
        <span data-testid={testIds.confectioners}>
          Кондитеров: {String(player.confectioners)}
        </span>
      }
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
