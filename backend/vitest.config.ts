import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',

    // Load env vars before each test file
    setupFiles: ['./src/test-utils/setup.ts'],

    // Only pick up test files — not source or config
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,

    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/test-utils/**',
        'src/db/migrate.ts', // migration runner — not unit-testable
        'src/index.ts',      // entry point — only calls buildApp + listen
      ],
      reporter: ['text', 'html', 'lcov'],

      // Enforce 100% once the full test suite is written (Phase 6).
      // Uncomment to gate CI:
      // thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
    },
  },

  resolve: {
    // Let Vitest resolve .js import extensions to .ts source files
    // (required because the project uses ESM with explicit .js extensions)
    extensions: ['.ts', '.js'],
  },
});
