import { defineConfig } from 'vite';

import angular from '@analogjs/vite-plugin-angular';
import path from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => ({
  plugins: [
    angular(),
    tsconfigPaths({
      projects: ['tsconfig.app.json', 'tsconfig.spec.json'],
    }),
  ],
  test: {
    globals: true,
    setupFiles: ['src/test/webapp/test-setup.ts'],
    environment: 'jsdom',
    include: ['src/test/webapp/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default', 'junit'],
    outputFile: 'junit.xml',
    coverage: {
      reporter: ['text', 'lcov', 'html', 'json-summary'],
      reportsDirectory: 'build/test-results/vitest/coverage',
      provider: 'istanbul',
      all: true,
      include: ['src/main/webapp/app/**/*.ts'],
      exclude: [
        '**/node_modules/**',
        '**/generated/**',
        '**/*.spec.ts',
        '**/*.test.ts',
        'src/test/webapp/util/**',
        '**/*.html',
        '**/*.scss',
        '**/*.route.ts',        // exclude route definition files (not really testable)
        '**/*.routes.ts',       // exclude route definition files (not really testable)
        '**/*.model.ts',        // exclude data model files (not really testable)
        'src/main/webapp/app/core/config/application-config.model.ts',
        'src/main/webapp/app/core/config/runtime-config.loader.ts',
      ],
      thresholds: {
        lines: 85.00,
        statements: 85.00,
        branches: 70.00,
        functions: 85.00,
      },
    },
  },
  define: {
    'import.meta.vitest': mode !== 'production',
  },
  resolve: {
    alias: {
      app: path.resolve(__dirname, 'src/main/webapp/app'),
      '@app': path.resolve(__dirname, 'src/main/webapp/app'),
    },
  },
}));
