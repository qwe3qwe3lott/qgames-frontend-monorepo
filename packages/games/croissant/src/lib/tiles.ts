// Геометрия тайла для рисования: только данные сервера (каталог тайлов приходит с карточкой игры),
// правил игры здесь нет.

/** Сторона тайла в контракте: N, E, S, W. */
export type Side = 'N' | 'E' | 'S' | 'W';

/** Чем занята сторона тайла. */
export type EdgeKind = 'BAKERY' | 'TRAIL' | 'PASTURE';

/** Тип участка сети. */
export type SpotKind = 'BAKERY' | 'TRAIL' | 'DAIRY' | 'PASTURE';

/** Стороны в порядке обхода по часовой стрелке. */
export const SIDES: readonly Side[] = ['N', 'E', 'S', 'W'];

/** Тип тайла в том виде, в каком он приходит в каталоге игры. */
export interface TileShape {
  readonly code: string;
  readonly title: string;
  readonly edges: readonly EdgeKind[];
  readonly bakeries: readonly {
    readonly sides: readonly Side[];
    readonly sign: boolean;
  }[];
  readonly trails: readonly {readonly sides: readonly Side[]}[];
  readonly dairy: boolean;
}

/** Повёрнутая плитка: чем занята каждая абсолютная сторона и где проходят тропы. */
export interface RenderTile {
  readonly edges: Readonly<Record<Side, EdgeKind>>;
  readonly trails: readonly Side[];
  readonly dairy: boolean;
  readonly signs: number;
}

/** Сторона в каталоге (базовая ориентация) по абсолютной стороне при повороте `rotation` градусов. */
function localSide(side: Side, rotation: number): Side {
  const turn = Math.round(rotation / 90);
  const index = (SIDES.indexOf(side) - turn + 4) % 4;
  return SIDES[index] ?? 'N';
}

/** Абсолютная сторона по стороне каталога. */
export function sideOf(local: Side, rotation: number): Side {
  const turn = Math.round(rotation / 90);
  return SIDES[(SIDES.indexOf(local) + turn) % 4] ?? 'N';
}

/** Повёрнутая геометрия тайла: по ней считается рисование. */
export function renderTile(tile: TileShape, rotation: number): RenderTile {
  const edges: Record<Side, EdgeKind> = {
    N: 'PASTURE',
    E: 'PASTURE',
    S: 'PASTURE',
    W: 'PASTURE',
  };
  SIDES.forEach(side => {
    const kind = tile.edges[SIDES.indexOf(localSide(side, rotation))];
    edges[side] = kind ?? 'PASTURE';
  });
  const trails = tile.trails.flatMap(trail =>
    trail.sides.map(side => sideOf(side, rotation)),
  );
  return {
    edges,
    trails,
    dairy: tile.dairy,
    signs: tile.bakeries.filter(bakery => bakery.sign).length,
  };
}

/**
 * Точка кондитера на плитке: у пекарни и тропы — на первой их стороне этого тайла, у сыроварни — в центре, у луга —
 * у угла. По ней ставится фишка: она видна даже при мелком масштабе и попадает в свой квартал.
 */
export function spotAnchor(
  tile: TileShape,
  rotation: number,
  kind: SpotKind,
  index: number,
  size: number,
): {x: number; y: number} {
  const half = size / 2;
  const sideMidpoint = (side: Side): {x: number; y: number} => {
    switch (side) {
      case 'N':
        return {x: half, y: size * 0.22};
      case 'E':
        return {x: size * 0.78, y: half};
      case 'S':
        return {x: half, y: size * 0.78};
      case 'W':
        return {x: size * 0.22, y: half};
    }
  };
  if (kind === 'DAIRY') {
    return {x: half, y: half};
  }
  if (kind === 'PASTURE') {
    return {x: size * 0.3, y: size * 0.7};
  }
  const local =
    kind === 'BAKERY'
      ? tile.bakeries[index]?.sides[0]
      : tile.trails[index]?.sides[0];
  return local === undefined
    ? {x: half, y: half}
    : sideMidpoint(sideOf(local, rotation));
}

/** Ключ клетки: `x:y` — так же, как id тайла в состоянии. */
export function cellKey(x: number, y: number): string {
  return `${String(x)}:${String(y)}`;
}
