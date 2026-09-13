import { defineConfig } from 'vitest/config';

/**
 * Base Vitest configuration for all packages.
 * Individual packages extend this with package-specific settings.
 */
export default defineConfig({
  test: {
    // Use native Node test runner for better ESM support
    environment: 'node',

    // Allow packages with no tests to pass (scaffold stage)
    passWithNoTests: true,

    // Coverage settings
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.config.{js,ts}',
        '**/*.test.{js,ts}',
        '**/*.spec.{js,ts}',
      ],
    },

    // Globals
    globals: false, // Prefer explicit imports for clarity

    // Reporter
    reporter: process.env.CI ? 'dot' : 'default',

    // Snapshot settings
    resolveSnapshotPath: (testPath, snapExtension) => {
      return testPath.replace(/\.test\.([tj]sx?)$/, `.test.${snapExtension}`);
    },
  },
});
