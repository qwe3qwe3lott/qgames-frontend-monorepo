// @ts-check
// Границы Feature-Sliced Design для eslint-plugin-boundaries (CLAUDE.md §3).

/** Слои со слайсами: снаружи доступны только через index.ts слайса. */
const SLICED_LAYERS = ['pages', 'widgets', 'features', 'entities'];

/** Куда можно импортировать из каждого слоя (только вниз). */
const ALLOWED_IMPORTS = {
  routes: ['app', 'pages', 'widgets', 'features', 'entities', 'shared'],
  app: ['routes', 'pages', 'widgets', 'features', 'entities', 'shared'],
  pages: ['widgets', 'features', 'entities', 'shared'],
  widgets: ['features', 'entities', 'shared'],
  features: ['entities', 'shared'],
  entities: ['shared'],
  shared: [],
};

/** Элементы FSD приложения на Rsbuild + TanStack Router. */
function elements() {
  // partialMatch: false — паттерн сопоставляется от корня пакета, а не с концом пути.
  return [
    // Роутинг: файлы роутов TanStack Router.
    {type: 'routes', pattern: 'src/routes'},
    {type: 'app', pattern: 'src/app'},
    ...SLICED_LAYERS.map(layer => ({
      type: layer,
      pattern: `src/${layer}/*`,
      capture: ['slice'],
    })),
    {type: 'shared', pattern: 'src/shared'},
  ].map(element => ({...element, partialMatch: false}));
}

// Импорты внутри одного элемента и внешние пакеты плагин не проверяет (checkInternals,
// checkAllOrigins выключены). Побеждает последняя совпавшая политика.
const policies = [
  ...Object.entries(ALLOWED_IMPORTS).map(([layer, allowed]) => ({
    from: {element: {type: layer}},
    allow: {to: {element: {types: {anyOf: allowed}}}},
  })),
  // Публичный API слайса — только его index.ts.
  {
    to: {element: {types: {anyOf: SLICED_LAYERS}}},
    disallow: {to: {element: {fileInternalPath: '!index.{ts,tsx}'}}},
    message: 'Импорт из слайса только через его index.ts (CLAUDE.md §3)',
  },
];

export const fsdBoundaries = {elements, policies};
