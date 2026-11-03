import type {CroissantSpotDtoOutput} from '@qgames/api/portal/zod';
import {useState, type KeyboardEvent} from 'react';

import {SPOT_LABELS} from '../lib/labels';
import {PALETTE} from '../lib/palette';
import {colorOf} from '../lib/players';
import {SIGN_SIZE, tileGeometry} from '../lib/tileGeometry';
import {partKey, type TilePart, type TileShape} from '../lib/tiles';
import {testIds} from './CroissantTile.testIds';

/** Заливка части тайла на выборе кондитера: доступна, под курсором или выбрана. */
const CHOICE_OPACITY = {idle: 0.12, active: 0.4} as const;

/** Толщина рамки последнего выложенного тайла, доля стороны тайла. */
const FRAME_WIDTH = 0.06;

const NO_COLORS: ReadonlyMap<string, string> = new Map();

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
  /** Участки тайла: по ним ставятся кондитеры. */
  readonly spots: readonly CroissantSpotDtoOutput[];
  /** Выбор участка для кондитера — только у тайла, который ходящий только что выложил. */
  readonly choice?: ConfectionerChoice | undefined;
  /** Цвета игроков по id (`playerColors`): фишки кондитеров на тайле. */
  readonly colors?: ReadonlyMap<string, string> | undefined;
  /** Рамка цвета игрока: последний выложенный тайл. */
  readonly frame?: string | undefined;
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
 * Плитка квартала: луг, пекарни и мучные тропы по модели тайла (`tileGeometry`), сыроварня или сад в центре, вывески и
 * фишки кондитеров. Рисуется в базовой ориентации каталога и поворачивается группой. На шаге кондитера поверх — части
 * тайла, которые можно выбрать, и полупрозрачная фишка на выбранной.
 */
export function CroissantTile({
  shape,
  tileId,
  rotation,
  size,
  spots,
  choice,
  colors = NO_COLORS,
  frame,
}: CroissantTileProps) {
  const geometry = tileGeometry(shape, size);
  const half = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${String(size)} ${String(size)}`}
      role="img"
      aria-label={shape.title}
      className="block"
    >
      <g
        transform={`rotate(${String(rotation)} ${String(half)} ${String(half)})`}
      >
        <rect width={size} height={size} fill={PALETTE.pasture} />
        {geometry.faces
          .filter(face => face.part.kind === 'BAKERY')
          .map(face => (
            <path
              key={partKey(face.part)}
              d={face.d}
              fill={PALETTE.bakery}
              stroke={PALETTE.bakeryLine}
              strokeWidth={1}
              strokeLinejoin="round"
            />
          ))}
        {geometry.trails.map(trail => (
          <path
            key={partKey(trail.part)}
            d={trail.d}
            fill="none"
            stroke={PALETTE.trailLine}
            strokeWidth={size * 0.08}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {geometry.dairy === null ? null : (
          <circle
            cx={geometry.dairy.center.x}
            cy={geometry.dairy.center.y}
            r={geometry.dairy.r}
            fill={PALETTE.dairy}
            stroke={PALETTE.dairyLine}
            strokeWidth={1}
          />
        )}
        {geometry.garden === null ? null : (
          <circle
            cx={geometry.garden.center.x}
            cy={geometry.garden.center.y}
            r={geometry.garden.r}
            fill={PALETTE.garden}
            stroke={PALETTE.gardenLine}
            strokeWidth={1}
          />
        )}
        {geometry.signs.map((sign, index) => (
          <rect
            key={`sign-${String(index)}`}
            x={sign.x - (size * SIGN_SIZE) / 2}
            y={sign.y - (size * SIGN_SIZE) / 2}
            width={size * SIGN_SIZE}
            height={size * SIGN_SIZE}
            fill={PALETTE.sign}
          />
        ))}
        {spots.map(spot =>
          // Фишка стоит на тайле, куда её поставили, а не на каждом тайле участка.
          spot.confectioners.map((confectioner, index) => {
            if (confectioner.tileId !== tileId) {
              return null;
            }
            const member = spot.members.find(item => item.tileId === tileId);
            const anchor = geometry.anchors.get(
              partKey({kind: spot.type, index: member?.index ?? 0}),
            );
            if (anchor === undefined) {
              return null;
            }
            return (
              <circle
                key={`${spot.id}-${confectioner.playerId}-${String(index)}`}
                cx={anchor.x}
                cy={anchor.y}
                r={size * 0.09}
                fill={colorOf(colors, confectioner.playerId)}
                stroke="white"
                strokeWidth={1.2}
              />
            );
          }),
        )}
        {choice === undefined ? null : (
          <ChoiceLayer shape={shape} size={size} choice={choice} />
        )}
      </g>
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
      {frame === undefined ? null : (
        <rect
          x={(size * FRAME_WIDTH) / 2}
          y={(size * FRAME_WIDTH) / 2}
          width={size * (1 - FRAME_WIDTH)}
          height={size * (1 - FRAME_WIDTH)}
          fill="none"
          stroke={frame}
          strokeWidth={size * FRAME_WIDTH}
          pointerEvents="none"
          data-testid={testIds.lastTileFrame}
        />
      )}
    </svg>
  );
}

interface ChoiceLayerProps {
  readonly shape: TileShape;
  readonly size: number;
  readonly choice: ConfectionerChoice;
}

/**
 * Слой выбора участка: доступные части тайла с пунктирным контуром и лёгкой заливкой. Участок под курсором и
 * выбранный залиты сильнее; наведение подсвечивает только этот тайл, другие тайлы участка не трогаются. Клик по части
 * выбирает её участок, повторный клик или клик по фишке снимает выбор.
 */
function ChoiceLayer({shape, size, choice}: ChoiceLayerProps) {
  const [hoveredSpotId, setHoveredSpotId] = useState<string | null>(null);
  const geometry = tileGeometry(shape, size);
  const spotOf = (part: TilePart): string | null =>
    choice.spots.get(partKey(part)) ?? null;
  const opacityOf = (spotId: string): number =>
    spotId === hoveredSpotId || spotId === choice.selectedSpotId
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
        setHoveredSpotId(spotId);
      },
      onMouseLeave: () => {
        setHoveredSpotId(null);
      },
    };
  };

  const dairyPart: TilePart = {kind: 'DAIRY', index: 0};
  const dairySpot = geometry.dairy === null ? null : spotOf(dairyPart);
  const selectedPart = [
    ...geometry.faces.map(face => face.part),
    ...geometry.trails.map(trail => trail.part),
    ...(geometry.dairy === null ? [] : [dairyPart]),
  ].find(
    part =>
      choice.selectedSpotId !== null && spotOf(part) === choice.selectedSpotId,
  );
  const draft =
    selectedPart === undefined
      ? undefined
      : geometry.anchors.get(partKey(selectedPart));

  return (
    <g>
      {geometry.faces.map(face => {
        const spotId = spotOf(face.part);
        if (spotId === null) {
          return null;
        }
        return (
          <path
            key={`face-${partKey(face.part)}`}
            d={face.d}
            fill={PALETTE.highlight}
            fillOpacity={opacityOf(spotId)}
            stroke={PALETTE.highlight}
            strokeWidth={1.5}
            strokeDasharray="4 3"
            strokeLinejoin="round"
            {...partProps(face.part, spotId)}
          />
        );
      })}
      {geometry.trails.map(trail => {
        const spotId = spotOf(trail.part);
        if (spotId === null) {
          return null;
        }
        return (
          <path
            key={`trail-${partKey(trail.part)}`}
            d={trail.d}
            fill="none"
            stroke={PALETTE.highlight}
            strokeOpacity={opacityOf(spotId) + 0.15}
            strokeWidth={size * 0.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            {...partProps(trail.part, spotId)}
          />
        );
      })}
      {geometry.dairy === null || dairySpot === null ? null : (
        <circle
          cx={geometry.dairy.center.x}
          cy={geometry.dairy.center.y}
          r={geometry.dairy.r * 1.25}
          fill={PALETTE.highlight}
          fillOpacity={opacityOf(dairySpot) + 0.1}
          stroke={PALETTE.highlight}
          strokeWidth={1.5}
          strokeDasharray="4 3"
          {...partProps(dairyPart, dairySpot)}
        />
      )}
      {draft === undefined ? null : (
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
