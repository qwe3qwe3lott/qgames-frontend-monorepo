// @ts-check
// Снимает статичные данные игры (`GET /api/games/croissant` → `assets`) с запущенного бэкенда в
// src/lib/assets.fixture.json: каталог тайлов и состав колоды для тестов геометрии и историй Storybook.
// Файл коммитится — Storybook и тесты работают без бэкенда.
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const apiUrl = (process.env['API_URL'] ?? 'http://localhost:8080').replace(
  /\/+$/,
  '',
);
const url = `${apiUrl}/api/games/croissant`;

const response = await fetch(url).catch((/** @type {unknown} */ error) => {
  throw new Error(`GET ${url}: бэкенд недоступен`, {cause: error});
});
if (!response.ok) {
  throw new Error(`GET ${url} ответил ${String(response.status)}`);
}
/** @type {unknown} */
const details = await response.json();
if (
  typeof details !== 'object' ||
  details === null ||
  !('assets' in details) ||
  details.assets === null
) {
  throw new Error(`GET ${url}: в ответе нет assets`);
}
const target = new URL('../src/lib/assets.fixture.json', import.meta.url);
await writeFile(target, `${JSON.stringify(details.assets, null, 2)}\n`);
console.log(`Assets ${url} сохранены в ${fileURLToPath(target)}`);
