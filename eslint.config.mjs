// @ts-check
import { defineConfig } from 'eslint/config';
import eslint from '@eslint/js';
import perfectionist from 'eslint-plugin-perfectionist';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  perfectionist.configs['recommended-natural'],
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  {
    rules: {
      'perfectionist/sort-imports': 'error',
      'perfectionist/sort-exports': 'error',
      'perfectionist/sort-decorators': 'off',
    },
  },
  {
    files: ['**/src/modules/*/*.{controller,service}.ts'],
    rules: {
      'perfectionist/sort-classes': [
        'error',
        {
          type: 'natural',
          order: 'asc',
          fallbackSort: { type: 'unsorted' },
          ignoreCase: true,
          specialCharacters: 'keep',
          partitionByComment: false,
          partitionByNewLine: false,
          newlinesBetween: 'ignore',
          ignoreCallbackDependenciesPatterns: [],
          groups: [
            'index-signature',
            ['static-property', 'static-accessor-property'],
            ['static-get-method', 'static-set-method'],
            ['protected-static-property', 'protected-static-accessor-property'],
            ['protected-static-get-method', 'protected-static-set-method'],
            ['private-static-property', 'private-static-accessor-property'],
            ['private-static-get-method', 'private-static-set-method'],
            'static-block',
            ['property', 'accessor-property'],
            ['get-method', 'set-method'],
            ['protected-property', 'protected-accessor-property'],
            ['protected-get-method', 'protected-set-method'],
            ['private-property', 'private-accessor-property'],
            ['private-get-method', 'private-set-method'],
            'constructor',
            'init-create',
            'get-find-read',
            'update-patch',
            'delete-remove',
            ['static-method', 'static-function-property'],
            ['protected-static-method', 'protected-static-function-property'],
            ['private-static-method', 'private-static-function-property'],
            ['method', 'function-property'],
            ['protected-method', 'protected-function-property'],
            ['private-method', 'private-function-property'],
            'unknown',
          ],
          customGroups: [
            {
              groupName: 'init-create',
              selector: 'method',
              elementNamePattern: '^(init|create)',
            },
            {
              groupName: 'get-find-read',
              selector: 'method',
              elementNamePattern: '^(get|find|read)',
            },
            {
              groupName: 'update-patch',
              selector: 'method',
              elementNamePattern: '^(update|patch)',
            },
            {
              groupName: 'delete-remove',
              selector: 'method',
              elementNamePattern: '^(delete|remove)',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/src/modules/*/*.service.ts'],
    rules: {
      'perfectionist/sort-objects': [
        'error',
        {
          type: 'alphabetical',
          order: 'asc',
          fallbackSort: { type: 'unsorted' },
          ignoreCase: true,
          specialCharacters: 'keep',
          partitionByComment: false,
          partitionByNewLine: false,
          newlinesBetween: 'ignore',
          objectDeclarations: true,
          destructuredObjects: true,
          styledComponents: true,
          ignorePattern: [],
          useConfigurationIf: {
            allNamesMatchPattern:
              '^(select|from|model|include|relations|join|where|groupBy|having|orderBy|sort|take|skip|data)$',
          },
          groups: [
            'select',
            'from-model',
            'include-relations-join',
            'where',
            'groupBy',
            'having',
            'orderBy-sort',
            'take-skip',
            'data',
          ],
          customGroups: [
            {
              groupName: 'select',
              selector: 'property',
              elementNamePattern: '^select$',
            },
            {
              groupName: 'from-model',
              selector: 'property',
              elementNamePattern: '^(from|model)$',
            },
            {
              groupName: 'include-relations-join',
              selector: 'property',
              elementNamePattern: '^(include|relations|join)$',
            },
            {
              groupName: 'where',
              selector: 'property',
              elementNamePattern: '^where$',
            },
            {
              groupName: 'groupBy',
              selector: 'property',
              elementNamePattern: '^groupBy$',
            },
            {
              groupName: 'having',
              selector: 'property',
              elementNamePattern: '^having$',
            },
            {
              groupName: 'orderBy-sort',
              selector: 'property',
              elementNamePattern: '^(orderBy|sort)$',
            },
            {
              groupName: 'take-skip',
              selector: 'property',
              elementNamePattern: '^(take|skip)$',
            },
            {
              groupName: 'data',
              selector: 'property',
              elementNamePattern: '^data$',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/src/modules/*/dto/*'],
    rules: {
      'perfectionist/sort-classes': 'off',
    },
  },
]);
