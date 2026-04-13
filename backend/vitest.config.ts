import { defineConfig } from 'vitest/config';

// Resolve the test DB URL at config-load time (main process) so every worker
// inherits the correct DATABASE_URL before any module (including config.ts) loads.
// Priority: DATABASE_URL_TEST env var → DATABASE_URL env var → local docker default
const testDbUrl =
  process.env['DATABASE_URL_TEST'] ??
  process.env['DATABASE_URL'] ??
  'postgresql://windom:windom@localhost:5433/windom_test';

export default defineConfig({
  test: {
    environment: 'node',

    // Inject DATABASE_URL into every worker process before module evaluation.
    // This guarantees config.ts reads the test DB URL even with dotenv/config.
    env: {
      DATABASE_URL: testDbUrl,
    },

    // Load env vars before each test file
    setupFiles: ['./src/test-utils/setup.ts'],

    // Only pick up test files — not source or config
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,

    // Run test files serially — all integration tests hit the same real DB
    // and use truncateAll() in beforeEach; parallel execution causes FK races.
    fileParallelism: false,

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
