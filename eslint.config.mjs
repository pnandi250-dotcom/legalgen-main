import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';

const nextRules = {
  'next/google-font-display': 'warn',
  'next/google-font-preconnect': 'warn',
  'next/next-script-for-ga': 'warn',
  'next/no-async-client-component': 'warn',
  'next/no-before-interactive-script-outside-document': 'warn',
  'next/no-css-tags': 'warn',
  'next/no-head-element': 'warn',
  'next/no-html-link-for-pages': 'warn',
  'next/no-img-element': 'warn',
  'next/no-location-assign-relative-destination': 'warn',
  'next/no-page-custom-font': 'warn',
  'next/no-styled-jsx-in-document': 'warn',
  'next/no-sync-scripts': 'warn',
  'next/no-title-in-document-head': 'warn',
  'next/no-typos': 'warn',
  'next/no-unwanted-polyfillio': 'warn',
  'next/inline-script-id': 'warn',
  'next/no-assign-module-variable': 'warn',
  'next/no-document-import-in-page': 'warn',
  'next/no-duplicate-head': 'warn',
  'next/no-head-import-in-document': 'warn',
  'next/no-script-component-in-head': 'warn',
};

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      next: nextPlugin,
    },
    rules: nextRules,
  },
  {
    ignores: ['.next/', 'node_modules/', 'dist/', 'build/', '*.config.*', 'vitest.setup.ts'],
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'react/no-unescaped-entities': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      '@typescript-eslint/no-require-imports': 'off',
      'prefer-const': 'warn',
      'no-useless-catch': 'warn',
      'no-useless-escape': 'warn',
      'no-useless-assignment': 'warn',
    },
  }
);