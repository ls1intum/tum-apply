/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { coverageConfigDefaults } from 'vitest/config';

import angular from '@analogjs/vite-plugin-angular';
import tsconfigPaths from "vite-tsconfig-paths";
import path from 'node:path';

export default defineConfig(({ mode }) => ({
  //plugins: [angular(), tsconfigPaths()],
  plugins: [tsconfigPaths()],
  test: {
    pool: 'threads',
    globals: true,
    setupFiles: ['src/test/webapp/vitest-setup.ts'],
    environment: 'jsdom',
    include: ['src/test/webapp/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'lcov'],
      exclude: ['**/*.config.*', '**/*.gen.*', '**/assets/**', ...coverageConfigDefaults.exclude],
    }
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
