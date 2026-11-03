import {defineConfig} from '@rsbuild/core';
import {pluginReact} from '@rsbuild/plugin-react';

// Конфиг Rsbuild для Storybook (storybook-react-rsbuild подхватывает его сам): только React и Tailwind (postcss.config.js).
export default defineConfig({
  plugins: [pluginReact()],
});
