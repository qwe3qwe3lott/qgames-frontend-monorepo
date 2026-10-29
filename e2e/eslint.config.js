// @ts-check
import {createConfig} from '@qgames/config/eslint';

export default [
  ...createConfig({
    tsconfigRootDir: import.meta.dirname,
    ignores: ['test-results/', 'playwright-report/', 'blob-report/'],
  }),
  {
    // Тесты работают только через фикстуры testPortal/testAdmin (e2e/CLAUDE.md).
    files: ['tests/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='goto']",
          message:
            'Страница открывается методом open() её модели, а не page.goto.',
        },
      ],
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/models',
                '**/models/**',
                '**/core/**',
                '**/scenario/**',
              ],
              message:
                'Модели и утилиты приходят через фикстуры testPortal/testAdmin.',
            },
            {
              group: ['@portal/*', '@admin/*', '@qgames/*'],
              message: 'test-ids используются только в моделях (src/).',
            },
          ],
        },
      ],
    },
  },
];
