import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

/** Mirrors web/eslint.config.js so there is one idiom across the repo. */
export default tseslint.config(
  { ignores: ['dist/**', '*.config.js', '*.config.ts'] },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      globals: { ...globals.browser },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // The page components are long prose ports; a hook-ordering rule firing on
      // them would be noise, but the real hook rules still apply to components
      // that use hooks (Updates).
      'react-hooks/set-state-in-effect': 'off',
    },
  },
);
