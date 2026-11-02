import type {CroissantSpotDtoOutput} from '@qgames/api/portal/zod';
import type {KeyboardEvent} from 'react';

import {SPOT_LABELS} from '../lib/labels';
import {PALETTE} from '../lib/palette';
import {
  partKey,
  partOutline,
  renderTile,
  spotAnchor,
  tileRegions,
  type EdgeKind,
  type Side,
  type TilePart,
  type TileShape,
} from '../lib/tiles';
import {testIds} from './CroissantTile.testIds';

/** Цвет стороны тайла: пекарня — тёплый камень, тропа — мука, луг — зелень. */
const EDGE_FILL: Readonly<Record<EdgeKind, string>> = {
  BAKERY: PALETTE.bakery,
  TRAIL: PALETTE.trail,
  PASTURE: PALETTE.pasture,
};

/** Углы стороны квадрата в SVG (ось Y вниз): от левого верхнего по часовой стрелке. */
const SIDE_POINTS: Readonly<
  Record<Side, readonly [number, number, number, number]>
> = {
  N: [0, 0, 1, 0],
  E: [1, 0, 1, 1],
  S: [1, 1, 0, 1],
  W: [0, 1, 0, 0],
};

/** Заливка части тайла на выборе кондитера: доступна, под курсором или выбрана. */
const CHOICE_OPACITY = {idle: 0.12, active: 0.4} as const;

/** Цвет фишки игрока: устойчив к порядку игроков в состоянии. */
export function confectionerColor(playerId: string): string {
  let hash = 0;
  for (const char of playerId) {
    hash = (hash * 31 + char.charCodeAt(0)) % 997;
  }
  return PALETTE.confectioners[hash % PALETTE.confectioners.length] ?? '#000';
}

/**
 * Шаг кондитера на этом тайле: какие части можно выбрать и какой участок выбран. Части сопоставлены участкам по
 * `partKey` → id участка; в карте только участки из `pending.spots`.
 */
export interface ConfectionerChoice {
  readonly spots: ReadonlyMap<string, string>;
  readonly selectedSpotId: string | null;
  /** Цвет фишки ходящего: ею показывается выбор до подтверждения. */
  readonly color: string;
  /** Выбрать участок; null — снять кондитера с выбранного. */
  readonly onChoose: (spotId: string | null) => void;
}

interface CroissantTileProps {
  readonly shape: TileShape;
  /** id выложенного тайла: по нему находятся его участки и фишки. */
  readonly tileId: string;
  readonly rotation: number;
  readonly size: number;
  /** Участки тайла: по ним ставятся кондитеры и подсвечивается выбранный участок. */
  readonly spots: readonly CroissantSpotDtoOutput[];
  readonly highlightedSpotId: string | null;
  readonly onHoverSpot: (spotId: string | null) => void;
  /** Выбор участка для кондитера — только у тайла, который ходящий только что выложил. */
  readonly choice?: ConfectionerChoice | undefined;
}

/** Нажатие Enter или пробела на части тайла — то же, что клик. */
function onActivate(action: () => void) {
  return (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };
}

/**
 * Плитка квартала: секторы сторон по типу (пекарня, тропа, луг), линии мучных троп, сыроварня в центре, вывеска и
 * фишки кондитеров. Рисуется только по данным состояния: каталог тайлов прислал сервер. На шаге кондитера поверх —
 * части тайла, которые можно выбрать, и полупрозрачная фишка на выбранной.
 */
export function CroissantTile({
  shape,
  tileId,
  rotation,
  size,
  spots,
  highlightedSpotId,
  onHoverSpot,
  choice,
}: CroissantTileProps) {
  const tile = renderTile(shape, rotation);
  const half = size / 2;
  const sides: readonly Side[] = ['N', 'E', 'S', 'W'];
  const highlighted = spots.some(spot => spot.id === highlightedSpotId);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${String(size)} ${String(size)}`}
      role="img"
      aria-label={shape.title}
      className="block"
    >
      <rect width={size} height={size} fill={PALETTE.pasture} />
      {sides.map(side => {
        const [x1, y1, x2, y2] = SIDE_POINTS[side];
        return (
          <polygon
            key={side}
            points={`${String(half)},${String(half)} ${String(x1 * size)},${String(y1 * size)} ${String(x2 * size)},${String(y2 * size)}`}
            fill={EDGE_FILL[tile.edges[side]]}
          />
        );
      })}
      {tile.trails.map(side => {
        const [x1, y1, x2, y2] = SIDE_POINTS[side];
        const midX = ((x1 + x2) / 2) * size;
        const midY = ((y1 + y2) / 2) * size;
        return (
          <line
            key={`trail-${side}`}
            x1={half}
            y1={half}
            x2={midX}
            y2={midY}
            stroke={PALETTE.trailLine}
            strokeWidth={size * 0.08}
            strokeLinecap="round"
          />
        );
      })}
      {tile.dairy ? (
        <circle
          cx={half}
          cy={half}
          r={size * 0.16}
          fill={PALETTE.dairy}
          stroke={PALETTE.dairyLine}
          strokeWidth={1}
        />
      ) : null}
      {tile.signs > 0 ? (
        <rect
          x={size * 0.44}
          y={size * 0.06}
          width={size * 0.12}
          height={size * 0.12}
          fill={PALETTE.sign}
        />
      ) : null}
      {spots.map(spot =>
        // Фишка стоит на тайле, куда её поставили, а не на каждом тайле участка.
        spot.confectioners.map((confectioner, index) => {
          if (confectioner.tileId !== tileId) {
            return null;
          }
          const member = spot.members.find(item => item.tileId === tileId);
          const anchor = spotAnchor(
            shape,
            rotation,
            spot.type,
            member?.index ?? 0,
            size,
          );
          return (
            <circle
              key={`${spot.id}-${confectioner.playerId}-${String(index)}`}
              cx={anchor.x}
              cy={anchor.y}
              r={size * 0.09}
              fill={confectionerColor(confectioner.playerId)}
              stroke="white"
              strokeWidth={1.2}
              onMouseEnter={() => {
                onHoverSpot(spot.id);
              }}
              onMouseLeave={() => {
                onHoverSpot(null);
              }}
            />
          );
        }),
      )}
      {choice === undefined ? null : (
        <ChoiceLayer
          shape={shape}
          rotation={rotation}
          size={size}
          choice={choice}
          highlightedSpotId={highlightedSpotId}
          onHoverSpot={onHoverSpot}
        />
      )}
      {highlighted ? (
        <rect
          x={1}
          y={1}
          width={size - 2}
          height={size - 2}
          fill="none"
          stroke={PALETTE.highlight}
          strokeWidth={3}
          rx={4}
          pointerEvents="none"
        />
      ) : null}
      <rect
        x={0.5}
        y={0.5}
        width={size - 1}
        height={size - 1}
        fill="none"
        stroke={PALETTE.grid}
        strokeWidth={1}
        pointerEvents="none"
      />
    </svg>
  );
}

interface ChoiceLayerProps {
  readonly shape: TileShape;
  readonly rotation: number;
  readonly size: number;
  readonly choice: ConfectionerChoice;
  readonly highlightedSpotId: string | null;
  readonly onHoverSpot: (spotId: string | null) => void;
}

/**
 * Слой выбора участка: доступные части тайла с пунктирным контуром и лёгкой заливкой. Участок под курсором и
 * выбранный залиты сильнее. Клик по части выбирает её участок, повторный клик или клик по фишке снимает выбор.
 */
function ChoiceLayer({
  shape,
  rotation,
  size,
  choice,
  highlightedSpotId,
  onHoverSpot,
}: ChoiceLayerProps) {
  const regions = tileRegions(shape, rotation, size);
  const spotOf = (part: TilePart | null): string | null =>
    part === null ? null : (choice.spots.get(partKey(part)) ?? null);
  const opacityOf = (spotId: string): number =>
    spotId === highlightedSpotId || spotId === choice.selectedSpotId
      ? CHOICE_OPACITY.active
      : CHOICE_OPACITY.idle;
  /** Общие свойства кликабельной части: выбор, наведение, клавиатура, подпись и test id. */
  const partProps = (part: TilePart, spotId: string) => {
    const toggle = (): void => {
      choice.onChoose(spotId === choice.selectedSpotId ? null : spotId);
    };
    return {
      role: 'button',
      tabIndex: 0,
      'aria-label': SPOT_LABELS[part.kind],
      'aria-pressed': spotId === choice.selectedSpotId,
      'data-testid': testIds.spotRegion,
      'data-spot-id': spotId,
      className: 'cursor-pointer outline-none',
      onClick: toggle,
      onKeyDown: onActivate(toggle),
      onMouseEnter: () => {
        onHoverSpot(spotId);
      },
      onMouseLeave: () => {
        onHoverSpot(null);
      },
    };
  };

  // Части тайла по участкам: у пекарни на двух сторонах или у луга — несколько треугольников, контур общий.
  const parts = new Map<string, TilePart>();
  regions.areas.forEach(area => {
    if (area.owner !== null && spotOf(area.owner) !== null) {
      parts.set(partKey(area.owner), area.owner);
    }
  });

  const selectedPart = [
    ...regions.areas.map(area => area.owner),
    ...regions.trails,
    ...(regions.dairy === null ? [] : [{kind: 'DAIRY' as const, index: 0}]),
  ].find(
    (part): part is TilePart =>
      part !== null &&
      choice.selectedSpotId !== null &&
      spotOf(part) === choice.selectedSpotId,
  );
  const draft =
    selectedPart === undefined
      ? null
      : spotAnchor(
          shape,
          rotation,
          selectedPart.kind,
          selectedPart.index,
          size,
        );

  const dairySpot =
    regions.dairy === null ? null : spotOf({kind: 'DAIRY', index: 0});

  return (
    <g>
      {regions.areas.map(area => {
        const spotId = spotOf(area.owner);
        if (area.owner === null || spotId === null) {
          return null;
        }
        const points = area.points
          .map(point => `${String(point.x)},${String(point.y)}`)
          .join(' ');
        return (
          <polygon
            key={`area-${area.edge.dir}${String(area.edge.half)}`}
            points={points}
            fill={PALETTE.highlight}
            fillOpacity={opacityOf(spotId)}
            {...partProps(area.owner, spotId)}
          />
        );
      })}
      {[...parts.values()].flatMap(part =>
        partOutline(regions.areas, part).map(([from, to], index) => (
          <line
            key={`outline-${partKey(part)}-${String(index)}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={PALETTE.highlight}
            strokeWidth={1.5}
            strokeDasharray="4 3"
            pointerEvents="none"
          />
        )),
      )}
      {regions.trails.map((trail, index) => {
        const spotId = spotOf(trail);
        if (spotId === null) {
          return null;
        }
        return (
          <line
            key={`trail-choice-${String(index)}`}
            x1={trail.from.x}
            y1={trail.from.y}
            x2={trail.to.x}
            y2={trail.to.y}
            stroke={PALETTE.highlight}
            strokeOpacity={opacityOf(spotId) + 0.15}
            strokeWidth={size * 0.2}
            strokeLinecap="round"
            {...partProps(trail, spotId)}
          />
        );
      })}
      {regions.dairy === null || dairySpot === null ? null : (
        <circle
          cx={regions.dairy.x}
          cy={regions.dairy.y}
          r={size * 0.2}
          fill={PALETTE.highlight}
          fillOpacity={opacityOf(dairySpot) + 0.1}
          stroke={PALETTE.highlight}
          strokeWidth={1.5}
          strokeDasharray="4 3"
          {...partProps({kind: 'DAIRY', index: 0}, dairySpot)}
        />
      )}
      {draft === null ? null : (
        <circle
          cx={draft.x}
          cy={draft.y}
          r={size * 0.09}
          fill={choice.color}
          fillOpacity={0.6}
          stroke="white"
          strokeWidth={1.2}
          strokeDasharray="2 2"
          role="button"
          tabIndex={0}
          aria-label="Убрать кондитера"
          data-testid={testIds.draftConfectioner}
          className="cursor-pointer outline-none"
          onClick={() => {
            choice.onChoose(null);
          }}
          onKeyDown={onActivate(() => {
            choice.onChoose(null);
          })}
        />
      )}
    </g>
  );
}
