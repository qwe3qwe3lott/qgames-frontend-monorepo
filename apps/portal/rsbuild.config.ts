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
