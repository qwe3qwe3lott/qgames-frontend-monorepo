import {defineConfig} from '@rsbuild/core';
import {pluginReact} from '@rsbuild/plugin-react';
import {tanstackRouter} from '@tanstack/router-plugin/rspack';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {index: './src/app/index.tsx'},
  },
  html: {
    title: 'qgames',
  },
  server: {
    port: 3000,
    strictPort: true,
    // Same-origin, как за nginx в Docker: /api/** уходит в бэкенд (CLAUDE.md §5).
    // Rsbuild не сжимает text/event-stream, поэтому SSE через прокси идёт без буферизации.
    proxy: {'/api': 'http://localhost:8080'},
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
});
