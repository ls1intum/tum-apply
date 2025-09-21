import { defineConfig } from 'vite';

import angular from '@analogjs/vite-plugin-angular';
import path from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => ({
  plugins: [angular(), tsconfigPaths()],
  test: {
    globals: true,
    setupFiles: ['src/test/webapp/test-setup.ts'],
    environment: 'jsdom',
    include: ['src/test/webapp/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default', 'junit'],
    outputFile: 'junit.xml',
    coverage: {
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: 'build/test-results/lcov-report',
      provider: 'v8',
      all: false,
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
