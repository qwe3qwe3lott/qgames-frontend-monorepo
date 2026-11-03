import {activeTimer, isSessionOver, playerClock} from '@qgames/game-core';
import {Clock} from '@qgames/game-ui/components/Clock';
import {PlayerCard as BasePlayerCard} from '@qgames/game-ui/components/PlayerCard';
import {WithHint} from '@qgames/ui/components/WithHint';
import {cn} from '@qgames/ui/lib/utils';
import {useMemo} from 'react';

import {turnActivity} from '../lib/labels';
import {colorOf, lastPlacedTile, playerColors} from '../lib/players';
import {
  isCroissantSession,
  parseCroissantTiles,
  type CroissantState,
  type CroissantTile as CroissantTileType,
} from '../state';
import type {GamePlayerCardProps} from '../types';
import {CroissantTile} from './CroissantTile';
import {testIds} from './PlayerCard.testIds';

const PREVIEW_SIZE = 32;

/** Превью в карточке: какой тайл, в каком повороте и что он значит для игрока. */
interface TilePreview {
  readonly code: string;
  readonly rotation: number;
  readonly hint: string;
}

/**
 * Тайл в карточке игрока: ходящий выкладывает `currentTile` — его видят все; на шаге кондитера и у остальных игроков —
 * последний выложенный ими тайл.
 */
function previewOf(
  state: CroissantState,
  playerId: string,
  moving: boolean,
): TilePreview | null {
  const confectionerStep =
    state.pending !== null && state.pending !== undefined;
  const current = state.currentTile ?? null;
  if (moving && !confectionerStep && current !== null) {
    return {code: current, rotation: 0, hint: 'Выкладывает тайл'};
  }
  const last = lastPlacedTile(state, playerId);
  return last === undefined
    ? null
    : {
        code: last.tile,
        rotation: last.rotation,
        hint: 'Последний выложенный тайл',
      };
}

/**
 * Карточка пекаря в списке игроков комнаты: «Золотые крошки», кондитеры кружками цвета игрока (стоящие на поле — тусклые),
 * подсветка ходящего и его шаг, превью тайла и часы. Не участник партии — базовая карточка.
 */
export function PlayerCard({session, card, assets}: GamePlayerCardProps) {
  const tiles = useMemo(() => parseCroissantTiles(assets), [assets]);
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
  const moving = !over && turnPlayerId === card.id;
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
  const color = colorOf(playerColors(state), card.id);
  const preview = previewOf(state, card.id, moving);
  const shape: CroissantTileType | undefined =
    preview === null
      ? undefined
      : tiles?.find(tile => tile.code === preview.code);

  const previewNode =
    preview === null || shape === undefined ? null : (
      <WithHint hint={`${preview.hint}: «${shape.title}»`}>
        <span
          data-testid={testIds.tilePreview}
          data-tile={preview.code}
          className="block shrink-0 overflow-hidden rounded-sm border"
        >
          <CroissantTile
            shape={shape}
            tileId={`preview-${card.id}`}
            rotation={preview.rotation}
            size={PREVIEW_SIZE}
            spots={[]}
          />
        </span>
      </WithHint>
    );
  const status =
    previewNode === null && clock === null ? undefined : (
      <span className="flex items-center gap-2">
        {previewNode}
        {clock === null ? null : (
          <Clock clock={clock} clockOffsetMs={session.clockOffsetMs} />
        )}
      </span>
    );

  return (
    <BasePlayerCard
      {...card}
      badges={[
        ...(card.badges ?? []),
        `${String(player.crumbs)} крошек`,
        // Выбыл по времени: не ходит и не может победить, крошки ему считаются.
        ...(player.out ? ['Выбыл'] : []),
      ]}
      active={moving}
      activity={turnActivity(
        state.pending !== null && state.pending !== undefined,
      )}
      note={
        <WithHint hint={hint}>
          <span
            role="img"
            aria-label={hint}
            data-testid={testIds.confectioners}
            data-available={available}
            data-total={total}
            data-color={player.color}
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
      {...(status === undefined ? {} : {status})}
    />
  );
}
