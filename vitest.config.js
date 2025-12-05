import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Run test files sequentially to avoid rate limiting issues
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: [
        'node_modules/**',
        'prisma/**',
        'src/scripts/**',
        'src/server.js',
        'coverage/**',
        '**/*.config.*',
        '**/index.js',
      ],
      // Thresholds disabled - integration tests run against external server
      // so v8 coverage cannot instrument the actual source code
    },
    include: ['tests/**/*.test.js'],
    setupFiles: ['./tests/setup.js'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
