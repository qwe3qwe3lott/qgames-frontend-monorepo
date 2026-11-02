import {activeTimer, isSessionOver, playerClock} from '@qgames/game-core';
import {Clock} from '@qgames/game-ui/components/Clock';
import {PlayerCard as BasePlayerCard} from '@qgames/game-ui/components/PlayerCard';
import {WithHint} from '@qgames/ui/components/WithHint';
import {cn} from '@qgames/ui/lib/utils';

import {isCroissantSession} from '../state';
import type {GamePlayerCardProps} from '../types';
import {confectionerColor} from './CroissantTile';
import {testIds} from './PlayerCard.testIds';

/**
 * Карточка пекаря в списке игроков комнаты: «Золотые крошки», кондитеры кружками цвета игрока (стоящие на поле — тусклые),
 * подсветка ходящего и часы. Не участник партии — базовая карточка.
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
  // Всего кондитеров — в запасе плюс стоящие на поле: они только переходят между запасом и полем.
  const available = player.confectioners;
  const onField = state.spots.reduce(
    (sum, spot) =>
      sum + spot.confectioners.filter(item => item.playerId === card.id).length,
    0,
  );
  const total = available + onField;
  const hint = `Доступные кондитеры: ${String(available)} из ${String(total)}`;
  const color = confectionerColor(card.id);

  return (
    <BasePlayerCard
      {...card}
      badges={[...(card.badges ?? []), `${String(player.crumbs)} крошек`]}
      active={!over && turnPlayerId === card.id}
      note={
        <WithHint hint={hint}>
          <span
            role="img"
            aria-label={hint}
            data-testid={testIds.confectioners}
            data-available={available}
            data-total={total}
            className="flex flex-wrap items-center gap-1 py-0.5"
          >
            {Array.from({length: total}, (_, index) => (
              <span
                key={index}
                className={cn(
                  'size-2.5 rounded-full',
                  index >= available && 'opacity-30',
                )}
                // Цвет фишки игрока — тот же, что на доске; классом не выразить.
                style={{backgroundColor: color}}
              />
            ))}
          </span>
        </WithHint>
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
