// Общее для историй тайла «Круассана» (Storybook): args истории Tile и сборка тайла из них. В index.ts пакета не входит.
import {z} from 'zod';

import {PALETTE} from '../lib/palette';
import {pastureHalves} from '../lib/tileGeometry';
import {SIDES, type EdgeKind, type Side, type TileShape} from '../lib/tiles';

export type PlayerColor = keyof typeof PALETTE.confectioners;

export const PLAYER_COLORS = Object.keys(PALETTE.confectioners).filter(
  (key): key is PlayerColor => key in PALETTE.confectioners,
);

export const NONE = 'нет';

/** Слоты элементов тайла в Controls: пустой слот — элемента нет. */
export const SLOTS = [1, 2, 3, 4] as const;
export type Slot = (typeof SLOTS)[number];

export const SIDE_LABELS: Readonly<Record<Side, string>> = {
  N: 'С',
  E: 'В',
  S: 'Ю',
  W: 'З',
};

/** Куда входит тропа из одной стороны: в пекарню слота, сыроварню или сад в центре. */
export const TRAIL_TARGETS = [
  'none',
  'bakery1',
  'bakery2',
  'bakery3',
  'bakery4',
  'dairy',
  'garden',
] as const;

export type TrailTarget = (typeof TRAIL_TARGETS)[number];

export const TRAIL_TARGET_LABELS: Readonly<Record<TrailTarget, string>> = {
  none: 'никуда',
  bakery1: 'пекарня 1',
  bakery2: 'пекарня 2',
  bakery3: 'пекарня 3',
  bakery4: 'пекарня 4',
  dairy: 'сыроварня',
  garden: 'сад',
};

/** Ключи args слота: числа в шаблонных строках запрещены линтером, поэтому ключи перечислены явно. */
export const SLOT_KEYS = {
  1: {
    bakerySides: 'bakery1Sides',
    bakerySign: 'bakery1Sign',
    trailSides: 'trail1Sides',
    trailTarget: 'trail1Target',
    bakery: 'bakery1',
    bakeryConfectioner: 'bakery1Confectioner',
    trailConfectioner: 'trail1Confectioner',
    pastureConfectioner: 'pasture1Confectioner',
  },
  2: {
    bakerySides: 'bakery2Sides',
    bakerySign: 'bakery2Sign',
    trailSides: 'trail2Sides',
    trailTarget: 'trail2Target',
    bakery: 'bakery2',
    bakeryConfectioner: 'bakery2Confectioner',
    trailConfectioner: 'trail2Confectioner',
    pastureConfectioner: 'pasture2Confectioner',
  },
  3: {
    bakerySides: 'bakery3Sides',
    bakerySign: 'bakery3Sign',
    trailSides: 'trail3Sides',
    trailTarget: 'trail3Target',
    bakery: 'bakery3',
    bakeryConfectioner: 'bakery3Confectioner',
    trailConfectioner: 'trail3Confectioner',
    pastureConfectioner: 'pasture3Confectioner',
  },
  4: {
    bakerySides: 'bakery4Sides',
    bakerySign: 'bakery4Sign',
    trailSides: 'trail4Sides',
    trailTarget: 'trail4Target',
    bakery: 'bakery4',
    bakeryConfectioner: 'bakery4Confectioner',
    trailConfectioner: 'trail4Confectioner',
    pastureConfectioner: 'pasture4Confectioner',
  },
} as const satisfies Record<
  Slot,
  {
    bakerySides: `bakery${Slot}Sides`;
    bakerySign: `bakery${Slot}Sign`;
    trailSides: `trail${Slot}Sides`;
    trailTarget: `trail${Slot}Target`;
    bakery: TrailTarget;
    bakeryConfectioner: `bakery${Slot}Confectioner`;
    trailConfectioner: `trail${Slot}Confectioner`;
    pastureConfectioner: `pasture${Slot}Confectioner`;
  }
>;

export const CENTERS = ['none', 'dairy', 'garden'] as const;

export type Center = (typeof CENTERS)[number];

/** Фишка кондитера на элементе: цвет игрока или её нет. */
export type Confectioner = PlayerColor | typeof NONE;

export type TileLayoutArgs = Readonly<
  Record<`bakery${Slot}Sides` | `trail${Slot}Sides`, readonly Side[]>
> &
  Readonly<Record<`bakery${Slot}Sign`, boolean>> &
  Readonly<Record<`trail${Slot}Target`, TrailTarget>> & {
    readonly center: Center;
  };

/**
 * Фишки кондитеров у элементов: пекарня и тропа слота, луг по номеру в списке частей (`PASTURE:N-1`), сыроварня.
 * Фишка на части, которой нет на тайле, не рисуется.
 */
export type ConfectionerArgs = Readonly<
  Record<
    | `bakery${Slot}Confectioner`
    | `trail${Slot}Confectioner`
    | `pasture${Slot}Confectioner`
    | 'dairyConfectioner',
    Confectioner
  >
>;

export interface TileStoryArgs extends TileLayoutArgs, ConfectionerArgs {
  readonly rotation: 0 | 90 | 180 | 270;
  readonly size: number;
  /** Рамка последнего выложенного тайла цветом игрока. */
  readonly frame: PlayerColor | typeof NONE;
  /** Шаг выбора кондитера: свободные части тайла можно выбрать кликом. */
  readonly choice: boolean;
  /** Выбранная часть на шаге кондитера; клик по тайлу меняет её. */
  readonly selected: string;
  /** Цвет ходящего: полупрозрачная фишка выбора. */
  readonly choiceColor: PlayerColor;
}

/** Args приходят и из URL (ссылки коллекции, ручная правка адреса): значение, не прошедшее проверку, — пустой слот. */
const SIDES_ARG = z.array(z.literal(SIDES)).catch([]);
const SIGN_ARG = z.boolean().catch(false);
const TARGET_ARG = z.literal(TRAIL_TARGETS).catch('none');
const CENTER_ARG = z.literal(CENTERS).catch('none');
const CONFECTIONER_ARG = z.literal([NONE, ...PLAYER_COLORS]).catch(NONE);

/** Фишка кондитера из args: неизвестное значение — фишки нет. */
export function confectionerOf(value: unknown): Confectioner {
  return CONFECTIONER_ARG.parse(value);
}

/** Стороны в порядке обхода: от первой стороны пекарни зависит место вывески. */
function sorted(sides: readonly Side[]): Side[] {
  return SIDES.filter(side => sides.includes(side));
}

/**
 * Тайл из элементов Controls в формате каталога (`TileShape`): пустые слоты пропускаются, индексы пекарен
 * сжимаются, луга выводит `pastureHalves`. Рядом — предупреждения о несогласованных элементах (тайл всё равно
 * рисуется).
 */
export function buildTile(args: TileLayoutArgs): {
  readonly shape: TileShape;
  readonly warnings: readonly string[];
  /** Непустые слоты пекарен и троп: индекс слота в списке — индекс части тайла. */
  readonly bakerySlots: readonly Slot[];
  readonly trailSlots: readonly Slot[];
} {
  const warnings: string[] = [];
  const center = CENTER_ARG.parse(args.center);
  const bakerySlots = SLOTS.filter(
    slot => SIDES_ARG.parse(args[SLOT_KEYS[slot].bakerySides]).length > 0,
  );
  const bakeries = bakerySlots.map(slot => ({
    sides: sorted(SIDES_ARG.parse(args[SLOT_KEYS[slot].bakerySides])),
    sign: SIGN_ARG.parse(args[SLOT_KEYS[slot].bakerySign]),
  }));
  const trailSlots = SLOTS.filter(
    slot => SIDES_ARG.parse(args[SLOT_KEYS[slot].trailSides]).length > 0,
  );
  const trails = trailSlots.map(slot => {
    const sides = sorted(SIDES_ARG.parse(args[SLOT_KEYS[slot].trailSides]));
    const target = TARGET_ARG.parse(args[SLOT_KEYS[slot].trailTarget]);
    const name = `Тропа ${String(slot)}`;
    if (sides.length === 1 && target === 'none') {
      warnings.push(`${name} из одной стороны никуда не входит`);
    }
    if (sides.length > 1 && target !== 'none') {
      warnings.push(`${name} соединяет стороны — цель не учитывается`);
    }
    const bakerySlot = SLOTS.find(item => target === SLOT_KEYS[item].bakery);
    const bakery =
      bakerySlot === undefined ? null : bakerySlots.indexOf(bakerySlot);
    if (bakery === -1) {
      warnings.push(`${name} входит в пустую пекарню ${String(bakerySlot)}`);
    }
    if ((target === 'dairy' || target === 'garden') && center !== target) {
      warnings.push(
        `${name} входит в ${TRAIL_TARGET_LABELS[target]}, а её нет в центре`,
      );
    }
    return {
      sides,
      bakery: sides.length === 1 && bakery !== -1 ? bakery : null,
      dairy: sides.length === 1 && target === 'dairy',
      garden: sides.length === 1 && target === 'garden',
    };
  });
  const edges = SIDES.map((side): EdgeKind => {
    const inBakeries = bakeries.filter(item =>
      item.sides.includes(side),
    ).length;
    const inTrails = trails.filter(item => item.sides.includes(side)).length;
    if (inBakeries + inTrails > 1) {
      warnings.push(
        `Сторона ${SIDE_LABELS[side]} занята несколькими элементами`,
      );
    }
    return inBakeries > 0 ? 'BAKERY' : inTrails > 0 ? 'TRAIL' : 'PASTURE';
  });
  const elements = {
    bakeries,
    trails,
    dairy: center === 'dairy',
    garden: center === 'garden',
  };
  const layout = {
    // tileGeometry кеширует геометрию по code: у каждого набора элементов — свой code.
    code: `story:${JSON.stringify(elements)}`,
    title: 'Тайл истории',
    edges,
    ...elements,
  };
  return {
    shape: {...layout, pastures: pastureHalves(layout)},
    warnings,
    bakerySlots,
    trailSlots,
  };
}

/** Слот по индексу элемента тайла: у каталога не больше 4 пекарен и 4 троп. */
function slotAt(index: number): Slot | undefined {
  return SLOTS.find(slot => slot === index + 1);
}

/** Цель тропы каталога → arg истории: пекарня по слоту, сыроварня, сад; у тропы на несколько сторон цели нет. */
function targetOf(trail: TileShape['trails'][number]): TrailTarget {
  if (trail.sides.length !== 1) {
    return 'none';
  }
  if (trail.dairy) {
    return 'dairy';
  }
  if (trail.garden) {
    return 'garden';
  }
  const slot =
    trail.bakery === null || trail.bakery === undefined
      ? undefined
      : slotAt(trail.bakery);
  return slot === undefined ? 'none' : SLOT_KEYS[slot].bakery;
}

/** Args истории Tile для типа тайла из каталога: элементы по слотам, остальные слоты пустые. */
export function tileArgsOf(shape: TileShape): TileLayoutArgs {
  const sides = (slot: Slot) => shape.bakeries[slot - 1]?.sides ?? [];
  const sign = (slot: Slot) => shape.bakeries[slot - 1]?.sign ?? false;
  const trailSides = (slot: Slot) => shape.trails[slot - 1]?.sides ?? [];
  const target = (slot: Slot): TrailTarget => {
    const trail = shape.trails[slot - 1];
    return trail === undefined ? 'none' : targetOf(trail);
  };
  return {
    bakery1Sides: sides(1),
    bakery1Sign: sign(1),
    bakery2Sides: sides(2),
    bakery2Sign: sign(2),
    bakery3Sides: sides(3),
    bakery3Sign: sign(3),
    bakery4Sides: sides(4),
    bakery4Sign: sign(4),
    trail1Sides: trailSides(1),
    trail1Target: target(1),
    trail2Sides: trailSides(2),
    trail2Target: target(2),
    trail3Sides: trailSides(3),
    trail3Target: target(3),
    trail4Sides: trailSides(4),
    trail4Target: target(4),
    center: shape.dairy ? 'dairy' : shape.garden ? 'garden' : 'none',
  };
}

/** Args в адресе Storybook (`args=key:value;…`): массив — по индексам, boolean — `!true`/`!false`. */
function urlArgs(args: TileLayoutArgs): string {
  return Object.entries(args)
    .flatMap(([key, value]: [string, unknown]) => {
      if (Array.isArray(value)) {
        // Пустой массив в ссылку не идёт: у истории Tile пустые слоты по умолчанию.
        return value.map(
          (item, index) => `${key}[${String(index)}]:${String(item)}`,
        );
      }
      return typeof value === 'boolean'
        ? [`${key}:!${String(value)}`]
        : [`${key}:${String(value)}`];
    })
    .join(';');
}

/** Ссылка на историю «Croissant / Tile» с элементами этого типа тайла (открывается во всём окне Storybook). */
export function tileStoryHref(shape: TileShape): string {
  return `/?path=/story/croissant-tile--tile&args=${urlArgs(tileArgsOf(shape))}`;
}
