import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    silent: false,
    reporters: ['default'],
    onConsoleLog: () => false, // Suppress console logs during tests
    dangerouslyIgnoreUnhandledErrors: true, // Ignore unhandled errors from intentional error testing
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'tests/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.config.ts',
        '**/node_modules/**',
        // Exclude server.ts from coverage - it's tested via integration tests
        // Integration tests spawn server as separate process, so coverage isn't captured
        'src/server.ts',
      ],
      include: ['src/**/*.ts'],
      all: true,
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 70,
        statements: 75,
      },
    },
  },
});
