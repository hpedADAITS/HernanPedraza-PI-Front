import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    css: true,
    include: ['test/**/*.{test,spec}.{ts,tsx,js}'],
    exclude: ['node_modules/**', 'dist/**', 'coverage/**', 'e2e/**', '**/*.spec.js'],
    pool: 'forks',
    maxWorkers: 4,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
