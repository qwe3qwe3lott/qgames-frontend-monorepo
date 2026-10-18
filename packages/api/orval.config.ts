import {defineConfig} from 'orval';

const input = {target: './openapi/gateway.json'};
const hooks = {afterAllFilesWrite: 'prettier --write'};

export default defineConfig({
  gateway: {
    input,
    hooks,
    output: {
      // Теги в спецификации на русском: tags-split дал бы кириллические имена файлов.
      mode: 'split',
      target: './src/generated/gateway.ts',
      schemas: './src/generated/model',
      client: 'react-query',
      httpClient: 'fetch',
      clean: ['./src/generated/model'],
      override: {
        mutator: {path: './src/mutator.ts', name: 'apiFetch'},
        fetch: {includeHttpResponseReturnType: false},
        query: {signal: true, shouldExportKeys: true},
      },
    },
  },
  gatewayZod: {
    input,
    hooks,
    output: {
      mode: 'single',
      target: './src/generated/gateway.zod.ts',
      client: 'zod',
    },
  },
});
