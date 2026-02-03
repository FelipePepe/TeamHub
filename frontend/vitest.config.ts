import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/e2e/**'],
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      thresholds: {
        'src/hooks/**': { statements: 80, lines: 80, branches: 80, functions: 80 },
        'src/app/(dashboard)/admin/departamentos/**': { statements: 80, lines: 80, branches: 80, functions: 80 },
        'src/app/(dashboard)/admin/empleados/[id]/**': { statements: 80, lines: 80, branches: 80, functions: 80 },
        'src/types/**': { statements: 0, lines: 0, branches: 0, functions: 0 },
      },
    },
  },
});
