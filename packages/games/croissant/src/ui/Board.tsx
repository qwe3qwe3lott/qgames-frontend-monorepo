import {activeTimer, isSessionOver, moveOptionsOf} from '@qgames/game-core';
import {
  GameOver,
  type GameOverResult,
} from '@qgames/game-ui/components/GameOver';
import {TurnIndicator} from '@qgames/game-ui/components/TurnIndicator';
import {Button} from '@qgames/ui/components/Button';
import {WithHint} from '@qgames/ui/components/WithHint';
import {useMemo, useRef, useState, type ReactNode} from 'react';
import {
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchRef,
} from 'react-zoom-pan-pinch';

import {reasonLabel, SPOT_LABELS} from '../lib/labels';
import {PALETTE} from '../lib/palette';
import {cellKey} from '../lib/tiles';
import {
  isCroissantSession,
  parseCroissantTiles,
  PLACE_CONFECTIONER,
  PLACE_TILE,
  SKIP_CONFECTIONER,
  type CroissantSession,
  type CroissantTile as CroissantTileType,
} from '../state';
import type {BoardProps} from '../types';
import {testIds} from './Board.testIds';
import {CroissantTile} from './CroissantTile';
import {ZoomControls} from './ZoomControls';

const TILE_SIZE = 72;
const PREVIEW_SIZE = 48;
const UNKNOWN_PLAYER_NAME = 'Игрок';
const MIN_SCALE = 0.25;
const MAX_SCALE = 2.5;
/**
 * Шаг колеса: библиотека прибавляет к масштабу `step × |deltaY|`. Щелчок колеса мыши (deltaY ≈ 100) — около +0.15,
 * тачпад с мелкими дельтами масштабирует плавно. Дефолт библиотеки (0.015) прыгает на +1.5 за щелчок.
 */
const WHEEL_STEP = 0.0015;
/** Наибольший масштаб, с которым «показать всё поле» раскрывает маленькое поле. */
const FIT_MAX_SCALE = 1.25;
/** Поля вокруг поля при «показать всё»: место под плавающие панели. */
const FIT_PADDING = 96;
/** Сдвиг поля (px экрана), после которого нажатие считается перетаскиванием, а не кликом. */
const DRAG_THRESHOLD = 5;

/** Вариант выкладки из состояния: клетка и повороты, при которых тайл сюда подходит. */
interface Placement {
  readonly x: number;
  readonly y: number;
  readonly rotations: readonly number[];
}

/** Выбор клетки: пока держится на той же партии (`seq`), после события журнала сбрасывается. */
interface Selection {
  readonly seq: number;
  readonly x: number;
  readonly y: number;
  readonly rotation: number;
}

/** Прямоугольник поля в координатах слоя (px при масштабе 1). */
interface Bounds {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

function placementsOf(
  data: Readonly<Record<string, unknown>> | undefined,
): readonly Placement[] {
  const raw = data?.['placements'];
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.flatMap(item => {
    if (typeof item !== 'object' || item === null) {
      return [];
    }
    const record = item as Record<string, unknown>;
    const x = record['x'];
    const y = record['y'];
    const rotations = record['rotations'];
    if (
      typeof x !== 'number' ||
      typeof y !== 'number' ||
      !Array.isArray(rotations)
    ) {
      return [];
    }
    return [
      {
        x,
        y,
        rotations: rotations.filter(
          (value): value is number => typeof value === 'number',
        ),
      },
    ];
  });
}

/**
 * Левый верхний угол клетки в слое поля. Начало слоя — клетка (0, 0) и от размеров поля не зависит: когда поле
 * растёт влево или вверх, уже выложенные тайлы не сдвигаются под пользователем.
 */
function positionOf(x: number, y: number): {left: number; top: number} {
  return {left: x * TILE_SIZE, top: -y * TILE_SIZE};
}

/** Масштаб и сдвиг слоя, при которых прямоугольник `bounds` целиком виден в обёртке по центру. */
function fitTransform(
  bounds: Bounds,
  width: number,
  height: number,
): {x: number; y: number; scale: number} {
  const boundsWidth = bounds.right - bounds.left;
  const boundsHeight = bounds.bottom - bounds.top;
  const scale = Math.min(
    FIT_MAX_SCALE,
    Math.max(
      MIN_SCALE,
      Math.min(
        (width - FIT_PADDING * 2) / boundsWidth,
        (height - FIT_PADDING * 2) / boundsHeight,
      ),
    ),
  );
  return {
    x: width / 2 - ((bounds.left + bounds.right) / 2) * scale,
    y: height / 2 - ((bounds.top + bounds.bottom) / 2) * scale,
    scale,
  };
}

/** Плавающая панель поверх поля. */
function Panel({children}: {children: ReactNode}) {
  return (
    <div className="pointer-events-auto rounded-md border bg-background/90 px-3 py-2 shadow-sm backdrop-blur-sm">
      {children}
    </div>
  );
}

interface CroissantBoardProps extends Omit<BoardProps, 'session' | 'assets'> {
  session: CroissantSession;
  /** Каталог тайлов из карточки игры: состояние ссылается на тип тайла по коду. */
  tiles: readonly CroissantTileType[];
}

function CroissantBoard({
  session,
  tiles,
  players,
  viewerId,
  onMove,
  movePending,
}: CroissantBoardProps) {
  const {state} = session;
  const spots = state.spots;
  const [selection, setSelection] = useState<Selection | null>(null);
  const [hoveredSpotId, setHoveredSpotId] = useState<string | null>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  // Положение слоя в начале жеста и признак «это было перетаскивание»: клик по клетке после панорамы не выбирает её.
  const panStart = useRef<{x: number; y: number} | null>(null);
  const dragged = useRef(false);

  const byId = new Map(players.map(player => [player.id, player]));
  const nameOf = (id: string): string =>
    byId.get(id)?.name ?? UNKNOWN_PLAYER_NAME;
  const timer = activeTimer(session);
  const paused = timer?.paused ?? false;
  const over = isSessionOver(session);
  const turnPlayerId = state.turns.currentPlayerId ?? null;

  const tilesByCode = useMemo(
    () => new Map(tiles.map(tile => [tile.code, tile])),
    [tiles],
  );
  const spotsByTile = useMemo(() => {
    const map = new Map<string, typeof spots>();
    spots.forEach(spot => {
      const seen = new Set<string>();
      spot.members.forEach(member => {
        if (seen.has(member.tileId)) {
          return;
        }
        seen.add(member.tileId);
        const list = map.get(member.tileId) ?? [];
        list.push(spot);
        map.set(member.tileId, list);
      });
    });
    return map;
  }, [spots]);
  const options = moveOptionsOf(state, viewerId);
  const placeOption = options.find(option => option.type === PLACE_TILE);
  const confectionerOption = options.find(
    option => option.type === PLACE_CONFECTIONER,
  );
  const canPlace =
    !over && !paused && !movePending && placeOption !== undefined;
  const placements = placementsOf(placeOption?.data ?? undefined);
  const canPlaceConfectioner =
    !over && !paused && !movePending && confectionerOption !== undefined;
  const current =
    selection !== null && selection.seq === session.seq && canPlace
      ? selection
      : null;

  const cells = [
    ...state.board.map(tile => ({x: tile.x, y: tile.y})),
    ...placements.map(item => ({x: item.x, y: item.y})),
  ];
  const xs = cells.map(cell => cell.x);
  const ys = cells.map(cell => cell.y);
  const bounds: Bounds = {
    left: Math.min(...xs, 0) * TILE_SIZE,
    top: -Math.max(...ys, 0) * TILE_SIZE,
    right: (Math.max(...xs, 0) + 1) * TILE_SIZE,
    bottom: (-Math.min(...ys, 0) + 1) * TILE_SIZE,
  };

  const fitView = (ref: ReactZoomPanPinchRef, animationMs: number): void => {
    const wrapper = ref.instance.wrapperComponent;
    if (wrapper === null) {
      return;
    }
    const {x, y, scale} = fitTransform(
      bounds,
      wrapper.clientWidth,
      wrapper.clientHeight,
    );
    void ref.setTransform(x, y, scale, animationMs);
  };

  const pending = state.pending;
  /** Код тайла, который сейчас выкладывает ходящий; null — колода кончилась. */
  const currentTileCode = state.currentTile ?? null;
  const currentShape =
    currentTileCode === null ? undefined : tilesByCode.get(currentTileCode);
  const pendingSpots = (pending?.spots ?? []).flatMap(id => {
    const spot = state.spots.find(item => item.id === id);
    return spot === undefined ? [] : [spot];
  });
  const myConfectioners =
    state.players.find(player => player.id === viewerId)?.confectioners ?? 0;

  const selectCell = (
    x: number,
    y: number,
    rotations: readonly number[],
  ): void => {
    const first = rotations[0] ?? 0;
    setSelection({
      seq: session.seq,
      x,
      y,
      rotation:
        current !== null && current.x === x && current.y === y
          ? current.rotation
          : first,
    });
  };

  const rotate = (step: number): void => {
    if (current === null) {
      return;
    }
    const placement = placements.find(
      item => item.x === current.x && item.y === current.y,
    );
    const allowed = placement?.rotations ?? [current.rotation];
    const index = allowed.indexOf(current.rotation);
    const next =
      allowed[(index + step + allowed.length) % allowed.length] ??
      current.rotation;
    setSelection({...current, rotation: next});
  };

  const field = (
    <TransformWrapper
      ref={transformRef}
      limitToBounds={false}
      minScale={MIN_SCALE}
      maxScale={MAX_SCALE}
      wheel={{step: WHEEL_STEP}}
      doubleClick={{disabled: true}}
      panning={{velocityDisabled: true}}
      onPanningStart={ref => {
        panStart.current = {x: ref.state.positionX, y: ref.state.positionY};
        dragged.current = false;
      }}
      onPanning={ref => {
        const start = panStart.current;
        if (
          start !== null &&
          Math.hypot(
            ref.state.positionX - start.x,
            ref.state.positionY - start.y,
          ) > DRAG_THRESHOLD
        ) {
          dragged.current = true;
        }
      }}
      onPinchStart={() => {
        dragged.current = true;
      }}
    >
      {/* Слой поля: размер 0×0, тайлы — абсолютно от клетки (0, 0); обёртка — на всю доску. */}
      <TransformComponent
        wrapperClass="size-full! cursor-grab active:cursor-grabbing"
        contentClass="size-0! overflow-visible!"
      >
        <div className="relative">
          {state.board.map(tile => {
            const shape = tilesByCode.get(tile.tile);
            const {left, top} = positionOf(tile.x, tile.y);
            if (shape === undefined) {
              return (
                <div
                  key={tile.id}
                  className="absolute flex items-center justify-center rounded-sm border text-xs text-destructive"
                  style={{left, top, width: TILE_SIZE, height: TILE_SIZE}}
                >
                  ?
                </div>
              );
            }
            return (
              <div key={tile.id} className="absolute" style={{left, top}}>
                <CroissantTile
                  shape={shape}
                  tileId={tile.id}
                  rotation={tile.rotation}
                  size={TILE_SIZE}
                  spots={spotsByTile.get(tile.id) ?? []}
                  highlightedSpotId={hoveredSpotId}
                  onHoverSpot={setHoveredSpotId}
                />
              </div>
            );
          })}
          {placements.map(placement => {
            const {left, top} = positionOf(placement.x, placement.y);
            const isSelected =
              current !== null &&
              current.x === placement.x &&
              current.y === placement.y;
            return (
              <button
                key={cellKey(placement.x, placement.y)}
                type="button"
                data-testid={testIds.cell}
                data-x={placement.x}
                data-y={placement.y}
                disabled={!canPlace}
                aria-label={`Клетка ${String(placement.x)}, ${String(placement.y)}`}
                onClick={() => {
                  if (dragged.current) {
                    dragged.current = false;
                    return;
                  }
                  selectCell(placement.x, placement.y, placement.rotations);
                }}
                className={
                  isSelected
                    ? 'absolute rounded-sm border-2 border-primary bg-primary/20'
                    : 'absolute rounded-sm border-2 border-dashed border-primary/50 hover:border-primary'
                }
                style={{left, top, width: TILE_SIZE, height: TILE_SIZE}}
              >
                {isSelected && currentShape !== undefined ? (
                  <span
                    data-testid={testIds.placementPreview}
                    className="pointer-events-none block"
                  >
                    <CroissantTile
                      shape={currentShape}
                      tileId={cellKey(current.x, current.y)}
                      rotation={current.rotation}
                      size={TILE_SIZE}
                      spots={[]}
                      highlightedSpotId={null}
                      onHoverSpot={() => undefined}
                    />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </TransformComponent>

      <div className="pointer-events-none absolute right-2 bottom-2">
        <div className="pointer-events-auto">
          <ZoomControls
            onFit={animationMs => {
              const ref = transformRef.current;
              if (ref !== null) {
                fitView(ref, animationMs);
              }
            }}
          />
        </div>
      </div>
    </TransformWrapper>
  );

  const legend = (
    <span className="flex items-center gap-2 text-xs text-muted-foreground">
      <span
        className="inline-block h-3 w-3 rounded-sm"
        style={{background: PALETTE.bakery}}
      />
      пекарня
      <span
        className="inline-block h-3 w-3 rounded-sm"
        style={{background: PALETTE.trailLine}}
      />
      тропа
      <span
        className="inline-block h-3 w-3 rounded-sm"
        style={{background: PALETTE.pasture}}
      />
      луг
    </span>
  );

  const deckInfo = (
    <span className="text-sm text-muted-foreground">
      В колоде: {Math.max(0, state.deckSize - state.deckPos)} · выложено:{' '}
      {state.board.length}
    </span>
  );

  if (over) {
    const cancelled = session.status === 'CANCELLED';
    const result = state.result ?? null;
    const totals = [...state.players]
      .sort((a, b) => b.crumbs - a.crumbs)
      .map(player => `${nameOf(player.id)}: ${String(player.crumbs)}`);
    const gameResult: GameOverResult | undefined =
      result === null
        ? undefined
        : result.outcome === 'DRAW'
          ? {outcome: 'DRAW'}
          : {outcome: 'WIN', winnerNames: result.winnerIds.map(nameOf)};
    return (
      <div
        className="flex min-h-0 flex-1 flex-col gap-2"
        data-testid={testIds.root}
      >
        <GameOver
          title={cancelled ? 'Партия отменена' : 'Игра окончена'}
          result={cancelled ? undefined : gameResult}
          description={
            cancelled || result === null
              ? undefined
              : `${reasonLabel(result.reason)}. Золотые крошки — ${totals.join(', ')}`
          }
        />
        <div className="relative min-h-[20rem] flex-1 overflow-hidden rounded-md border bg-muted/30">
          {field}
          <div className="pointer-events-none absolute top-2 left-2">
            <Panel>{legend}</Panel>
          </div>
        </div>
      </div>
    );
  }

  const showConfectioner =
    pending !== undefined && pending !== null && canPlaceConfectioner;
  const hint = canPlace
    ? current === null
      ? 'Ваш ход: выберите клетку у края поля'
      : null
    : pending !== undefined && pending !== null && !canPlaceConfectioner
      ? 'Ждём ход другого пекаря'
      : null;

  return (
    <div
      className="relative min-h-[20rem] flex-1 overflow-hidden rounded-md border bg-muted/30"
      data-testid={testIds.root}
    >
      {field}

      {/* Сверху: чей ход, пауза, колода; справа — легенда. */}
      <div className="pointer-events-none absolute inset-x-2 top-2 flex flex-wrap items-start justify-between gap-2">
        <Panel>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <TurnIndicator
              playerName={
                turnPlayerId === null
                  ? UNKNOWN_PLAYER_NAME
                  : nameOf(turnPlayerId)
              }
            />
            {paused ? (
              <span
                role="status"
                className="rounded-md bg-muted px-2 py-0.5 text-sm font-medium text-muted-foreground"
              >
                Пауза
              </span>
            ) : null}
            {deckInfo}
          </div>
        </Panel>
        {/* На узком экране легенда заняла бы целую строку над полем. */}
        <div className="hidden sm:block">
          <Panel>{legend}</Panel>
        </div>
      </div>

      {/* Снизу по центру: панель хода (тайл, повороты, выкладка) или шаг кондитера. */}
      {canPlace || showConfectioner || hint !== null ? (
        <div className="pointer-events-none absolute inset-x-2 bottom-2 flex justify-center pr-14">
          <Panel>
            {canPlace ? (
              <div className="flex flex-wrap items-center gap-3">
                {currentShape === undefined ? null : (
                  <span className="shrink-0 overflow-hidden rounded-sm border">
                    <CroissantTile
                      shape={currentShape}
                      tileId="current"
                      rotation={current?.rotation ?? 0}
                      size={PREVIEW_SIZE}
                      spots={[]}
                      highlightedSpotId={null}
                      onHoverSpot={() => undefined}
                    />
                  </span>
                )}
                <span className="text-sm">
                  {current === null
                    ? `Тайл «${currentShape?.title ?? '—'}». ${hint ?? ''}`
                    : `Тайл «${currentShape?.title ?? '—'}» в клетку ${String(current.x)}, ${String(current.y)}`}
                </span>
                {current === null ? null : (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={testIds.rotateLeft}
                      disabled={movePending}
                      onClick={() => {
                        rotate(-1);
                      }}
                    >
                      Повернуть влево
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={testIds.rotateRight}
                      disabled={movePending}
                      onClick={() => {
                        rotate(1);
                      }}
                    >
                      Повернуть вправо
                    </Button>
                    <Button
                      size="sm"
                      data-testid={testIds.placeTile}
                      disabled={movePending}
                      onClick={() => {
                        onMove({
                          type: PLACE_TILE,
                          data: {
                            x: current.x,
                            y: current.y,
                            rotation: current.rotation,
                          },
                        });
                      }}
                    >
                      Выложить
                    </Button>
                  </div>
                )}
              </div>
            ) : showConfectioner ? (
              <div className="flex flex-col gap-2">
                <div className="text-sm font-medium">
                  Кондитер: выберите участок нового тайла ({myConfectioners} в
                  запасе)
                </div>
                <div className="flex flex-wrap gap-2">
                  {pendingSpots.map(spot => (
                    <WithHint key={spot.id} hint={null}>
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={testIds.spot}
                        data-spot-id={spot.id}
                        disabled={movePending}
                        onMouseEnter={() => {
                          setHoveredSpotId(spot.id);
                        }}
                        onMouseLeave={() => {
                          setHoveredSpotId(null);
                        }}
                        onClick={() => {
                          onMove({
                            type: PLACE_CONFECTIONER,
                            data: {spotId: spot.id},
                          });
                        }}
                      >
                        {SPOT_LABELS[spot.type]}
                      </Button>
                    </WithHint>
                  ))}
                  <Button
                    size="sm"
                    data-testid={testIds.skipConfectioner}
                    disabled={movePending}
                    onClick={() => {
                      onMove({type: SKIP_CONFECTIONER});
                    }}
                  >
                    Без кондитера
                  </Button>
                </div>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">{hint}</span>
            )}
          </Panel>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Доска «Круассана»: правила знает сервер, доска рисует выложенные тайлы и действует только по `moveOptions` игрока.
 * Пока ход не принят, доска ничего не додумывает — состояние приходит событиями потока. Поле занимает всю доску:
 * масштаб — колесом, щипком и кнопками, панорама — перетаскиванием мышью или пальцем; панели хода — поверх поля.
 */
export function Board({session, assets, ...props}: BoardProps) {
  const tiles = useMemo(() => parseCroissantTiles(assets), [assets]);
  if (tiles === null) {
    return (
      <p className="text-destructive">Не удалось прочитать каталог тайлов</p>
    );
  }
  if (!isCroissantSession(session)) {
    return (
      <p className="text-destructive">Не удалось прочитать состояние партии</p>
    );
  }
  return <CroissantBoard session={session} tiles={tiles} {...props} />;
}
