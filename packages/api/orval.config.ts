import {defineConfig} from 'orval';

const hooks = {afterAllFilesWrite: 'prettier --write'};

/** Общие настройки react-query-клиента: один mutator на оба gateway. */
const queryOverride = {
  mutator: {path: './src/mutator.ts', name: 'apiFetch'},
  fetch: {includeHttpResponseReturnType: false},
  query: {signal: true, shouldExportKeys: true},
};

const gatewayInput = {target: './openapi/gateway.json'};
const adminGatewayInput = {target: './openapi/admin-gateway.json'};

export default defineConfig({
  // user-gateway — портал.
  gateway: {
    input: gatewayInput,
    hooks,
    output: {
      // Теги в спецификации на русском: tags-split дал бы кириллические имена файлов.
      mode: 'split',
      target: './src/generated/gateway.ts',
      schemas: './src/generated/model',
      client: 'react-query',
      httpClient: 'fetch',
      clean: ['./src/generated/model'],
      override: queryOverride,
    },
  },
  gatewayZod: {
    input: gatewayInput,
    hooks,
    output: {
      mode: 'single',
      target: './src/generated/gateway.zod.ts',
      client: 'zod',
    },
  },
  // admin-gateway — админка.
  adminGateway: {
    input: adminGatewayInput,
    hooks,
    output: {
      mode: 'split',
      target: './src/generated/admin-gateway/admin-gateway.ts',
      schemas: './src/generated/admin-gateway/model',
      client: 'react-query',
      httpClient: 'fetch',
      clean: ['./src/generated/admin-gateway/model'],
      override: queryOverride,
    },
  },
  adminGatewayZod: {
    input: adminGatewayInput,
    hooks,
    output: {
      mode: 'single',
      target: './src/generated/admin-gateway/admin-gateway.zod.ts',
      client: 'zod',
    },
  },
});
