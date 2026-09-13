import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import importX from 'eslint-plugin-import-x';
import prettier from 'eslint-config-prettier';

export default [
  eslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        // Browser globals for web apps
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        HTMLElement: 'readonly',
        Element: 'readonly',
        Node: 'readonly',
        // Node.js globals for CLI and test files
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'import-x': importX,
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // Import boundaries - prevent cross-package violations
      'import-x/no-restricted-paths': [
        'error',
        {
          zones: [
            // UI cannot import from game engines
            {
              target: './packages/ui-components',
              from: './packages/!(ui-components)',
              message: 'UI components must not import from engine packages',
            },
            // Rules engine must be pure - no UI
            {
              target: './packages/rules-engine',
              from: './packages/ui-components',
              message: 'Rules engine must remain pure - no UI dependencies',
            },
            // Bot engine only depends on rules + hand-evaluator
            {
              target: './packages/bot-engine',
              from: './packages/!(rules-engine|hand-evaluator|tile-model|bot-engine)',
              message: 'Bot engine can only depend on rules-engine, hand-evaluator, and tile-model',
            },
          ],
        },
      ],

      // No Math.random() in engine packages (determinism requirement)
      'no-restricted-globals': [
        'error',
        {
          name: 'Math.random',
          message: 'Use injected PRNG instead of Math.random() for determinism',
        },
      ],

      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
    },
  },
  // Test files - linted without typed rules to avoid tsconfig project mismatch
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        // No project - tests are excluded from main tsconfig
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'off', // Allow console in tests
      'prefer-const': 'error',
    },
  },
  // CLI files - allow console.log
  {
    files: ['**/cli-*.ts', '**/cli-*.js'],
    rules: {
      'no-console': 'off',
    },
  },
  prettier,
];
