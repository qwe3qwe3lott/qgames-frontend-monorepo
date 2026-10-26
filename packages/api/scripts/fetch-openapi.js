// @ts-check
// Снимает OpenAPI-группы запущенного бэкенда в openapi/*.json.
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const apiUrl = (process.env['API_URL'] ?? 'http://localhost:8080').replace(
  /\/+$/,
  '',
);

/** Группы springdoc бэкенда: `/v3/api-docs/<группа>` → `openapi/<группа>.json`. */
const groups = /** @type {const} */ (['portal', 'admin']);

/** @param {string} group */
async function fetchSpec(group) {
  const url = `${apiUrl}/v3/api-docs/${group}`;
  const response = await fetch(url).catch((/** @type {unknown} */ error) => {
    throw new Error(`GET ${url}: бэкенд недоступен`, {cause: error});
  });
  if (!response.ok) {
    throw new Error(`GET ${url} ответил ${response.status}`);
  }
  /** @type {unknown} */
  const spec = await response.json();
  const target = new URL(`../openapi/${group}.json`, import.meta.url);
  await writeFile(target, `${JSON.stringify(spec, null, 2)}\n`);
  console.log(`OpenAPI ${url} сохранён в ${fileURLToPath(target)}`);
}

// Группы снимаются независимо: ошибка одной не мешает обновить другую,
// но команда всё равно завершается ошибкой.
const results = await Promise.allSettled(groups.map(fetchSpec));
const failures = results.filter(result => result.status === 'rejected');
for (const failure of failures) {
  console.error(failure.reason);
}
if (failures.length > 0) {
  process.exitCode = 1;
}
