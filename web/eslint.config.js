import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  // ── Ignored paths ──────────────────────────────────────────────────────────
  { ignores: ['dist/**', 'coverage/**', '*.config.js', '*.config.ts'] },

  // ── Base rules ─────────────────────────────────────────────────────────────
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // ── React plugins ──────────────────────────────────────────────────────────
  {
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // React Compiler optimisation hints — disabled: project does not use React Compiler
      // and the flagged patterns (setState guard at top of effect, dynamic icon component,
      // manual memoization) are valid idioms that would require invasive refactoring for
      // no runtime benefit.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },

  // ── TypeScript + project rules ─────────────────────────────────────────────
  {
    rules: {
      // Types
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // Code quality
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
    },
  },

  // ── Prettier must be last — disables conflicting formatting rules ───────────
  prettier,
);
