// @ts-check
// Снимает OpenAPI-спецификации с запущенных gateway в openapi/*.json.
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

/** @type {readonly {url: string, file: string}[]} */
const sources = [
  {
    url: process.env['GATEWAY_URL'] ?? 'http://localhost:8080',
    file: 'gateway.json',
  },
  {
    url: process.env['ADMIN_GATEWAY_URL'] ?? 'http://localhost:8083',
    file: 'admin-gateway.json',
  },
];

/** @param {{url: string, file: string}} source */
async function fetchSpec({url, file}) {
  const response = await fetch(`${url}/v3/api-docs`).catch(
    (/** @type {unknown} */ error) => {
      throw new Error(`GET ${url}/v3/api-docs: gateway недоступен`, {
        cause: error,
      });
    },
  );
  if (!response.ok) {
    throw new Error(`GET ${url}/v3/api-docs ответил ${response.status}`);
  }
  /** @type {unknown} */
  const spec = await response.json();
  const target = new URL(`../openapi/${file}`, import.meta.url);
  await writeFile(target, `${JSON.stringify(spec, null, 2)}\n`);
  console.log(`OpenAPI ${url} сохранён в ${fileURLToPath(target)}`);
}

// Каждый gateway снимается независимо: недоступность одного не мешает обновить другой,
// но команда всё равно завершается ошибкой.
const results = await Promise.allSettled(sources.map(fetchSpec));
const failures = results.filter(result => result.status === 'rejected');
for (const failure of failures) {
  console.error(failure.reason);
}
if (failures.length > 0) {
  process.exitCode = 1;
}
