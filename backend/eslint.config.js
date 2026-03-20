import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  // ── Ignored paths ──────────────────────────────────────────────────────────
  { ignores: ['dist/**', 'drizzle/**', 'coverage/**', '*.config.js'] },

  // ── Base rules ─────────────────────────────────────────────────────────────
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  // ── TypeScript parser options ───────────────────────────────────────────────
  {
    languageOptions: {
      parserOptions: {
        // tsconfig.eslint.json extends tsconfig.json but re-includes test files
        // so ESLint can type-check them without them being part of the build.
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // ── Project-specific rules ─────────────────────────────────────────────────
  {
    rules: {
      // Types
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],

      // Safety
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-non-null-assertion': 'error',

      // Code quality
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],

      // Logging — use req.log / app.log in production code, not console
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // ── Prettier must be last — disables conflicting formatting rules ───────────
  prettier,
);
