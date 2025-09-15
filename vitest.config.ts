import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: [
      'javascript/vitest/**/*.spec.ts',
      'src/test/javascript/vitest/**/*.spec.ts'
    ],
    root: './'
  },
  resolve: {
    alias: {
      'app': resolve(__dirname, './src/main/webapp/app'),
      '@': resolve(__dirname, './src/main/webapp')
    }
  }
});
