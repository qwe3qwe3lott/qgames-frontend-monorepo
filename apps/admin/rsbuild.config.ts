import {localHttpsServer} from '@qgames/config/local-https';
import {defineConfig} from '@rsbuild/core';
import {pluginReact} from '@rsbuild/plugin-react';
import {tanstackRouter} from '@tanstack/router-plugin/rspack';

// Сборка (Docker, CI) идёт без сертификатов и .env корня: HTTPS-хост — только у dev-сервера.
export default defineConfig(({command}) => ({
  plugins: [pluginReact()],
  source: {
    entry: {index: './src/app/index.tsx'},
  },
  html: {
    title: 'qgames — админка',
  },
  server: {
    // https://admin.<LOCAL_DOMAIN>:3001, как админка в проде (за вычетом порта, куки от него не зависят).
    ...(command === 'dev' ? localHttpsServer({subdomain: 'admin'}) : {}),
    port: 3001,
    strictPort: true,
    // Same-origin, как за nginx в Docker: админка ходит только в /api/admin/** (CLAUDE.md §1, §5).
    // Rsbuild не сжимает text/event-stream, поэтому SSE через прокси идёт без буферизации.
    proxy: {'/api/admin': 'http://localhost:8080'},
  },
  tools: {
    rspack: {
      plugins: [
        tanstackRouter({
          target: 'react',
          autoCodeSplitting: true,
          routesDirectory: './src/routes',
          generatedRouteTree: './src/app/routeTree.gen.ts',
        }),
      ],
    },
  },
}));
