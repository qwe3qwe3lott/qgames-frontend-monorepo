import type {CroissantSpotDtoOutput} from '@qgames/api/portal/zod';

import {PALETTE} from '../lib/palette';
import {
  renderTile,
  spotAnchor,
  type EdgeKind,
  type Side,
  type TileShape,
} from '../lib/tiles';

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

/** Цвет фишки игрока: устойчив к порядку игроков в состоянии. */
export function confectionerColor(playerId: string): string {
  let hash = 0;
  for (const char of playerId) {
    hash = (hash * 31 + char.charCodeAt(0)) % 997;
  }
  return PALETTE.confectioners[hash % PALETTE.confectioners.length] ?? '#000';
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
}

/**
 * Плитка квартала: секторы сторон по типу (пекарня, тропа, луг), линии мучных троп, сыроварня в центре, вывеска и
 * фишки кондитеров. Рисуется только по данным состояния: каталог тайлов прислал сервер.
 */
export function CroissantTile({
  shape,
  tileId,
  rotation,
  size,
  spots,
  highlightedSpotId,
  onHoverSpot,
}: CroissantTileProps) {
  const tile = renderTile(shape, rotation);
  const half = size / 2;
  const sides: readonly Side[] = ['N', 'E', 'S', 'W'];
  const highlighted = spots.some(spot => spot.id === highlightedSpotId);
  const hasBakery = sides.some(side => tile.edges[side] === 'BAKERY');

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
      {hasBakery ? (
        <circle cx={half} cy={half} r={size * 0.1} fill={PALETTE.wall} />
      ) : null}
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
        spot.confectioners.map((confectioner, index) => {
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
      />
    </svg>
  );
}
