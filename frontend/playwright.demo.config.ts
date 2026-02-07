import { defineConfig } from '@playwright/test';

/**
 * Configuración para grabar demos visuales de TeamHub.
 * Ejecutar: npm run demo (con ventana) o npm run demo:record (sin ventana)
 */
export default defineConfig({
  testDir: './e2e/demo',
  timeout: 300_000, // 5 minutos para demo completa
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'demo-report' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    // Grabación de video
    video: 'on',
    // Resolución Full HD
    viewport: { width: 1920, height: 1080 },
    // Ralentizar un poco las acciones
    launchOptions: {
      slowMo: 100,
    },
    // Screenshots
    screenshot: 'on',
    // Trace para debug
    trace: 'on',
    // HTTPS
    ignoreHTTPSErrors: true,
  },
  outputDir: 'demo-output',
  projects: [
    {
      name: 'demo',
      use: {
        browserName: 'chromium',
        colorScheme: 'light',
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
