// @ts-check
import {createConfig} from '@qgames/config/eslint';

export default [
  ...createConfig({
    tsconfigRootDir: import.meta.dirname,
    react: true,
    fsd: 'spa',
  }),
  {
    // Игры подключаются только через import() в реестре, иначе попадут
    // в основной бандл (CLAUDE.md §2).
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@qgames/game-*',
                '!@qgames/game-ui',
                '!@qgames/game-ui/**',
              ],
              allowTypeImports: true,
              message:
                'Пакеты игр подключаются только динамическим import() в entities/game/model/registry.ts.',
            },
          ],
        },
      ],
    },
  },
];
