// eslint-disable-next-line import/no-unresolved
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: [
      '**/*.test.js',
      '**/*.spec.js',
    ],
    exclude: [
      '**/node_modules/**',
      '**/cypress/**',
      '**/blocks/commerce-*/**',
      '**/blocks/mfe-*/**',
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'cypress/',
        'tests/',
        'blocks/commerce-*/',
        'blocks/mfe-*/',
        '**/*.test.js',
        '**/*.spec.js',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@blocks': path.resolve(__dirname, './blocks'),
      '@scripts': path.resolve(__dirname, './scripts'),
      '@utils': path.resolve(__dirname, './utils'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});
