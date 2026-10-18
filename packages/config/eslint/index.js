// @ts-check
import path from 'node:path';

import nextPlugin from '@next/eslint-plugin-next';
import queryPlugin from '@tanstack/eslint-plugin-query';
import boundaries from 'eslint-plugin-boundaries';
import reactHooks from 'eslint-plugin-react-hooks';
import {defineConfig} from 'eslint/config';
import globals from 'globals';
import gts from 'gts';
import tseslint from 'typescript-eslint';

import {fsdBoundaries} from './fsd.js';

const TS_FILES = ['**/*.ts', '**/*.tsx'];
const JS_FILES = ['**/*.js', '**/*.mjs', '**/*.cjs'];

/**
 * @typedef {object} ConfigOptions
 * @property {string} tsconfigRootDir Каталог пакета (`import.meta.dirname` в eslint.config.js).
 * @property {boolean} [react] React-правила (react-hooks, TanStack Query).
 * @property {boolean} [next] Правила Next.js.
 * @property {'spa' | 'next'} [fsd] Проверка границ FSD (CLAUDE.md §3).
 * @property {string[]} [ignores] Дополнительные игнорируемые пути.
 */

/**
 * ESLint flat-конфиг пакета: gts + typescript-eslint strict (CLAUDE.md §7).
 * @param {ConfigOptions} options
 */
export function createConfig({
  tsconfigRootDir,
  react = false,
  next = false,
  fsd,
  ignores = [],
}) {
  return defineConfig([
    {
      ignores: [
        '**/node_modules/',
        '**/dist/',
        '**/out/',
        '**/.next/',
        '**/.turbo/',
        '**/next-env.d.ts',
        '**/routeTree.gen.ts',
        ...ignores,
      ],
    },
    ...gts,
    {
      // gts считает eslint.config.js CommonJS-файлом, у нас все конфиги — ESM.
      files: JS_FILES,
      languageOptions: {
        sourceType: 'module',
        globals: globals.node,
      },
    },
    {
      files: TS_FILES,
      extends: [
        tseslint.configs.strictTypeChecked,
        tseslint.configs.stylisticTypeChecked,
      ],
      languageOptions: {
        parserOptions: {
          // gts задаёт project: './tsconfig.json'; используем project service.
          project: false,
          projectService: true,
          tsconfigRootDir,
        },
      },
      rules: {
        // gts отключает эти правила; CLAUDE.md §6 их требует.
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/ban-ts-comment': [
          'error',
          {'ts-expect-error': 'allow-with-description'},
        ],
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/consistent-type-assertions': [
          'error',
          {assertionStyle: 'as', objectLiteralTypeAssertions: 'never'},
        ],
      },
    },
    ...(react
      ? [
          {
            files: TS_FILES,
            languageOptions: {globals: globals.browser},
          },
          reactHooks.configs.flat.recommended,
          ...queryPlugin.configs['flat/recommended'],
        ]
      : []),
    ...(next ? [nextPlugin.configs['core-web-vitals']] : []),
    ...(fsd === undefined
      ? []
      : [
          {
            files: TS_FILES,
            plugins: {boundaries},
            settings: {
              'boundaries/root-path': tsconfigRootDir,
              'boundaries/elements': fsdBoundaries.elements(fsd),
              'import/resolver': {
                typescript: {
                  project: path.join(tsconfigRootDir, 'tsconfig.json'),
                },
              },
            },
            rules: {
              'boundaries/dependencies': [
                'error',
                {default: 'disallow', policies: fsdBoundaries.policies},
              ],
            },
          },
        ]),
  ]);
}
