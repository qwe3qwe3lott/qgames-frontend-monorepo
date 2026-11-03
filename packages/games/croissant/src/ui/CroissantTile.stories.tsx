import type {CroissantSpotDtoOutput} from '@qgames/api/portal/zod';
import type {ArgTypes, Meta, StoryObj} from 'storybook-react-rsbuild';
import {useArgs} from 'storybook/preview-api';

import {SPOT_LABELS} from '../lib/labels';
import {PALETTE} from '../lib/palette';
import {tileGeometry} from '../lib/tileGeometry';
import {SIDES, type SpotKind} from '../lib/tiles';
import {CroissantTile} from './CroissantTile';
import {
  buildTile,
  CENTERS,
  confectionerOf,
  NONE,
  PLAYER_COLORS,
  SIDE_LABELS,
  SLOT_KEYS,
  SLOTS,
  TRAIL_TARGET_LABELS,
  TRAIL_TARGETS,
  type Confectioner,
  type ConfectionerArgs,
  type PlayerColor,
  type Slot,
  type TileStoryArgs,
} from './CroissantTile.storyArgs';

const TILE_ID = 'story';

const SPOT_KINDS: readonly SpotKind[] = ['BAKERY', 'TRAIL', 'DAIRY', 'PASTURE'];

/** Все возможные ключи частей (`partKey`): варианты выбора в Controls. */
const PART_KEYS = [
  ...['BAKERY', 'TRAIL', 'PASTURE'].flatMap(kind =>
    SLOTS.map(slot => `${kind}:${String(slot - 1)}`),
  ),
  'DAIRY:0',
];

/** Фишки кондитеров из args: ключ части (`partKey`) → цвет игрока. */
function placements(
  args: ConfectionerArgs,
  bakerySlots: readonly Slot[],
  trailSlots: readonly Slot[],
): [string, PlayerColor][] {
  const entries: [string, Confectioner][] = [
    ...bakerySlots.map((slot, index): [string, Confectioner] => [
      `BAKERY:${String(index)}`,
      confectionerOf(args[SLOT_KEYS[slot].bakeryConfectioner]),
    ]),
    ...trailSlots.map((slot, index): [string, Confectioner] => [
      `TRAIL:${String(index)}`,
      confectionerOf(args[SLOT_KEYS[slot].trailConfectioner]),
    ]),
    ...SLOTS.map((slot): [string, Confectioner] => [
      `PASTURE:${String(slot - 1)}`,
      confectionerOf(args[SLOT_KEYS[slot].pastureConfectioner]),
    ]),
    ['DAIRY:0', confectionerOf(args.dairyConfectioner)],
  ];
  return entries.flatMap(([key, color]): [string, PlayerColor][] =>
    color === NONE ? [] : [[key, color]],
  );
}

/** Разбор ключа части: тип и индекс; чужой ключ — null. */
function parsePartKey(key: string): {kind: SpotKind; index: number} | null {
  const [kindText, indexText] = key.split(':');
  const kind = SPOT_KINDS.find(item => item === kindText);
  const index = Number(indexText);
  return kind === undefined || !Number.isInteger(index) ? null : {kind, index};
}

/**
 * Один тайл, собранный из элементов Controls. Участки и фишки — в формате партии (`CroissantSpotDto`), каждый
 * участок — одна часть этого тайла.
 */
function TileStory({
  onSelect,
  ...args
}: TileStoryArgs & {readonly onSelect: (selected: string) => void}) {
  const {shape, warnings, bakerySlots, trailSlots} = buildTile(args);
  const partKeys = [...tileGeometry(shape, 1).anchors.keys()];
  const placed = placements(args, bakerySlots, trailSlots).filter(([key]) =>
    partKeys.includes(key),
  );
  const spots = placed.flatMap(([key, color]): CroissantSpotDtoOutput[] => {
    const part = parsePartKey(key);
    return part === null
      ? []
      : [
          {
            id: key,
            type: part.kind,
            members: [{tileId: TILE_ID, index: part.index}],
            confectioners: [{playerId: color, tileId: TILE_ID}],
            bakeries: [],
            complete: false,
            open: 0,
            signs: 0,
          },
        ];
  });
  const colors = new Map(
    PLAYER_COLORS.map(color => [color, PALETTE.confectioners[color]]),
  );
  const occupied = new Set(placed.map(([key]) => key));
  const free = partKeys.filter(key => !occupied.has(key));

  return (
    <div className="flex flex-col items-center gap-4">
      <CroissantTile
        shape={shape}
        tileId={TILE_ID}
        rotation={args.rotation}
        size={args.size}
        spots={spots}
        colors={colors}
        frame={
          args.frame === NONE ? undefined : PALETTE.confectioners[args.frame]
        }
        choice={
          args.choice
            ? {
                spots: new Map(free.map(key => [key, key])),
                selectedSpotId: free.includes(args.selected)
                  ? args.selected
                  : null,
                color: PALETTE.confectioners[args.choiceColor],
                onChoose: spotId => {
                  onSelect(spotId ?? NONE);
                },
              }
            : undefined
        }
      />
      {warnings.length === 0 ? null : (
        <ul className="text-sm text-destructive">
          {warnings.map(warning => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
      <ul className="text-sm text-muted-foreground">
        {partKeys.map(key => {
          const part = parsePartKey(key);
          return (
            <li key={key}>
              <code>{key}</code>
              {part === null ? null : ` — ${SPOT_LABELS[part.kind]}`}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function confectionerControl(
  name: string,
  category: string,
): ArgTypes<TileStoryArgs>['dairyConfectioner'] {
  return {
    name,
    control: 'select',
    options: [NONE, ...PLAYER_COLORS],
    table: {category},
  };
}

const sidesControl = (name: string, category: string) => ({
  name,
  control: {type: 'inline-check', labels: SIDE_LABELS},
  options: SIDES,
  table: {category},
});

/** Controls одного слота: пекарня, тропа и луг с номером слота, у каждого — фишка кондитера. */
function slotArgTypes(slot: Slot): Partial<ArgTypes<TileStoryArgs>> {
  const keys = SLOT_KEYS[slot];
  const number = String(slot);
  return {
    [keys.bakerySides]: sidesControl(`Пекарня ${number} · стороны`, 'Пекарни'),
    [keys.bakerySign]: {
      name: `Пекарня ${number} · вывеска`,
      control: 'boolean',
      table: {category: 'Пекарни'},
    },
    [keys.bakeryConfectioner]: confectionerControl(
      `Пекарня ${number} · кондитер`,
      'Пекарни',
    ),
    [keys.trailSides]: sidesControl(`Тропа ${number} · стороны`, 'Тропы'),
    [keys.trailTarget]: {
      name: `Тропа ${number} · входит в`,
      control: {type: 'select', labels: TRAIL_TARGET_LABELS},
      options: TRAIL_TARGETS,
      table: {category: 'Тропы'},
    },
    [keys.trailConfectioner]: confectionerControl(
      `Тропа ${number} · кондитер`,
      'Тропы',
    ),
    [keys.pastureConfectioner]: {
      ...confectionerControl(`Луг ${number} · кондитер`, 'Луга'),
      description: `Луг PASTURE:${String(slot - 1)} из списка частей под тайлом`,
    },
  };
}

const meta = {
  title: 'Croissant/Tile',
  // useArgs — хук Storybook: работает в render истории, а не внутри компонента.
  render: function Render(args) {
    const [, updateArgs] = useArgs<TileStoryArgs>();
    return (
      <TileStory
        {...args}
        onSelect={selected => {
          updateArgs({selected});
        }}
      />
    );
  },
  // По умолчанию — пустой тайл (сплошной луг): ссылки коллекции только добавляют элементы, а очистить слот через URL
  // Storybook не даёт (пустой массив для check-контрола он отбрасывает).
  args: {
    bakery1Sides: [],
    bakery1Sign: false,
    bakery1Confectioner: NONE,
    bakery2Sides: [],
    bakery2Sign: false,
    bakery2Confectioner: NONE,
    bakery3Sides: [],
    bakery3Sign: false,
    bakery3Confectioner: NONE,
    bakery4Sides: [],
    bakery4Sign: false,
    bakery4Confectioner: NONE,
    trail1Sides: [],
    trail1Target: 'none',
    trail1Confectioner: NONE,
    trail2Sides: [],
    trail2Target: 'none',
    trail2Confectioner: NONE,
    trail3Sides: [],
    trail3Target: 'none',
    trail3Confectioner: NONE,
    trail4Sides: [],
    trail4Target: 'none',
    trail4Confectioner: NONE,
    pasture1Confectioner: NONE,
    pasture2Confectioner: NONE,
    pasture3Confectioner: NONE,
    pasture4Confectioner: NONE,
    center: 'none',
    dairyConfectioner: NONE,
    rotation: 0,
    size: 160,
    frame: NONE,
    choice: false,
    selected: NONE,
    choiceColor: 'RED',
  },
  argTypes: {
    ...SLOTS.reduce<Partial<ArgTypes<TileStoryArgs>>>(
      (all, slot) => ({...all, ...slotArgTypes(slot)}),
      {},
    ),
    center: {
      name: 'Центр',
      control: {
        type: 'inline-radio',
        labels: {none: 'ничего', dairy: 'сыроварня', garden: 'сад'},
      },
      options: CENTERS,
      table: {category: 'Центр'},
    },
    dairyConfectioner: confectionerControl('Сыроварня · кондитер', 'Центр'),
    rotation: {
      name: 'Поворот',
      control: 'inline-radio',
      options: [0, 90, 180, 270],
      table: {category: 'Вид'},
    },
    size: {
      name: 'Размер, px',
      control: {type: 'range', min: 48, max: 320, step: 8},
      table: {category: 'Вид'},
    },
    frame: {
      name: 'Рамка последнего тайла',
      control: 'select',
      options: [NONE, ...PLAYER_COLORS],
      table: {category: 'Вид'},
    },
    choice: {
      name: 'Шаг выбора кондитера',
      control: 'boolean',
      table: {category: 'Кондитеры'},
    },
    selected: {
      name: 'Выбранная часть',
      control: 'select',
      options: [NONE, ...PART_KEYS],
      if: {arg: 'choice'},
      table: {category: 'Кондитеры'},
    },
    choiceColor: {
      name: 'Цвет ходящего',
      control: 'select',
      options: PLAYER_COLORS,
      if: {arg: 'choice'},
      table: {category: 'Кондитеры'},
    },
  },
} satisfies Meta<TileStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Tile: Story = {};
