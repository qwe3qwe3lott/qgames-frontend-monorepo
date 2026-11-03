import type {StorybookConfig} from 'storybook-react-rsbuild';

// Витрина UI-компонентов: истории *.stories.tsx лежат рядом с компонентами в packages/*. Только пропсы, без бэкенда
// и моков сервера (CLAUDE.md §8).
const config: StorybookConfig = {
  framework: 'storybook-react-rsbuild',
  stories: ['../../../packages/**/src/**/*.stories.tsx'],
  core: {disableTelemetry: true},
};

export default config;
