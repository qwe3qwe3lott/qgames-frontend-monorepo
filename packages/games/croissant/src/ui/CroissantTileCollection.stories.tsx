import {CroissantAssetsDto} from '@qgames/api/portal/zod';
import type {Meta, StoryObj} from 'storybook-react-rsbuild';

import assets from '../lib/assets.fixture.json';
import type {TileShape} from '../lib/tiles';
import {CroissantTile} from './CroissantTile';
import {tileStoryHref} from './CroissantTile.storyArgs';

// Снимок `GET /api/games/croissant` → `assets` (`pnpm assets:fetch`): каталог типов и состав модулей, без бэкенда.
const ASSETS = CroissantAssetsDto.parse(assets);

const TILE_SIZE = 96;

/** Код базовой игры в `assets.modules`. */
const BASE_MODULE = 'base';

interface CollectionArgs {
  /** Тайлы базовой игры в коллекции. */
  readonly base: boolean;
}

/** Тип тайла и сколько раз он встречается во включённых модулях. */
interface CollectionItem {
  readonly shape: TileShape;
  readonly count: number;
}

/** Тайлы включённых модулей: численности одного типа складываются, порядок — как в модулях. */
function collectionOf(modules: ReadonlySet<string>): readonly CollectionItem[] {
  const counts = new Map<string, number>();
  ASSETS.modules
    .filter(module => modules.has(module.code))
    .forEach(module => {
      module.tiles.forEach(tile => {
        counts.set(tile.code, (counts.get(tile.code) ?? 0) + tile.count);
      });
    });
  return [...counts].flatMap(([code, count]) => {
    const shape = ASSETS.tiles.find(tile => tile.code === code);
    return shape === undefined ? [] : [{shape, count}];
  });
}

/**
 * Коллекция тайлов: сетка с названием и численностью. Клик по тайлу или названию открывает историю «Croissant / Tile»
 * с элементами этого тайла.
 */
function TileCollection({base}: CollectionArgs) {
  const items = collectionOf(new Set(base ? [BASE_MODULE] : []));
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-3">
      {items.map(({shape, count}) => (
        <li key={shape.code}>
          <a
            href={tileStoryHref(shape)}
            target="_top"
            className="flex flex-col items-center gap-1 text-center text-sm"
            data-tile-code={shape.code}
          >
            <CroissantTile
              shape={shape}
              tileId={shape.code}
              rotation={0}
              size={TILE_SIZE}
              spots={[]}
            />
            <span>«{shape.title}»</span>
            {/* Неразрывный пробел у одиночного тайла: строка остаётся, ряды сетки одной высоты. */}
            <span className="text-muted-foreground">
              {count > 1 ? `x${String(count)}` : ' '}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

const meta = {
  title: 'Croissant/Tile collection',
  component: TileCollection,
  parameters: {layout: 'padded'},
  args: {base: true},
  argTypes: {
    base: {name: 'Базовая игра', control: 'boolean'},
  },
} satisfies Meta<CollectionArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TileCollectionStory: Story = {name: 'Tile collection'};
