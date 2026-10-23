import {
  defineConfig,
  defineTransformer,
  type OpenApiOperationObject,
} from 'orval';

const hooks = {afterAllFilesWrite: 'prettier --write'};

/** Общие настройки react-query-клиента: один mutator на оба gateway. */
const queryOverride = {
  mutator: {path: './src/mutator.ts', name: 'apiFetch'},
  fetch: {includeHttpResponseReturnType: false},
  query: {signal: true, shouldExportKeys: true},
};

const gatewayInput = {target: './openapi/gateway.json'};
const adminGatewayInput = {target: './openapi/admin-gateway.json'};

const EVENT_STREAM = 'text/event-stream';

const HTTP_METHODS = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
] as const;

/** Ответ 200 операции — поток Server-Sent Events. */
function isEventStream(operation: OpenApiOperationObject | undefined): boolean {
  const ok = operation?.responses?.['200'];
  return (
    ok !== undefined &&
    'content' in ok &&
    ok.content[EVENT_STREAM] !== undefined
  );
}

/**
 * Убирает ручки-потоки SSE (ответ 200 — `text/event-stream`): fetch-функция и
 * хук react-query повисли бы на бесконечном ответе. Поток открывается через
 * EventSource (`apps/portal/src/shared/lib/sse`); модели событий остаются —
 * они в `components.schemas`.
 */
const withoutEventStreams = defineTransformer(spec => {
  const paths = Object.entries(spec.paths ?? {}).filter(([path, item]) => {
    const methods = HTTP_METHODS.filter(method => item[method] !== undefined);
    const streams = methods.filter(method => isEventStream(item[method]));
    if (streams.length > 0 && streams.length < methods.length) {
      throw new Error(`${path}: поток SSE и обычные методы на одном пути`);
    }
    return streams.length === 0;
  });
  return {...spec, paths: Object.fromEntries(paths)};
});

export default defineConfig({
  // user-gateway — портал.
  gateway: {
    input: {...gatewayInput, override: {transformer: withoutEventStreams}},
    hooks,
    output: {
      // Файл ручек на каждый тег (теги — латиницей), barrel — query/index.ts.
      mode: 'tags-split',
      target: './src/generated/gateway/query/index.ts',
      schemas: './src/generated/gateway/model',
      client: 'react-query',
      httpClient: 'fetch',
      clean: true,
      override: queryOverride,
    },
  },
  gatewayZod: {
    input: gatewayInput,
    hooks,
    output: {
      mode: 'tags-split',
      target: './src/generated/gateway/zod/index.ts',
      client: 'zod',
      clean: true,
      override: {
        zod: {
          // Схемы всех components: Zod для text/event-stream Orval не строит,
          // а события SSE проверяются схемой RoomStreamEvent (CLAUDE.md §6).
          generateReusableSchemas: true,
          // oneOf с discriminator — zod.discriminatedUnion.
          generateDiscriminatedUnion: true,
        },
      },
    },
  },
  // admin-gateway — админка.
  adminGateway: {
    input: adminGatewayInput,
    hooks,
    output: {
      mode: 'tags-split',
      target: './src/generated/admin-gateway/query/index.ts',
      schemas: './src/generated/admin-gateway/model',
      client: 'react-query',
      httpClient: 'fetch',
      clean: true,
      override: queryOverride,
    },
  },
  adminGatewayZod: {
    input: adminGatewayInput,
    hooks,
    output: {
      mode: 'tags-split',
      target: './src/generated/admin-gateway/zod/index.ts',
      client: 'zod',
      clean: true,
    },
  },
});
