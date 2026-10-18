// @ts-check
// Снимает OpenAPI-спецификацию с запущенного gateway в openapi/gateway.json.
import {writeFile} from 'node:fs/promises';

const url = process.env['GATEWAY_URL'] ?? 'http://localhost:8080';
const target = new URL('../openapi/gateway.json', import.meta.url);

const response = await fetch(`${url}/v3/api-docs`);
if (!response.ok) {
  throw new Error(`GET ${url}/v3/api-docs ответил ${response.status}`);
}
/** @type {unknown} */
const spec = await response.json();
await writeFile(target, `${JSON.stringify(spec, null, 2)}\n`);
console.log(`OpenAPI сохранён в ${target.pathname}`);
