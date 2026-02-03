/**
 * E2E: CRUD Departamentos (Fase 7).
 * Requiere tokens en proceso: E2E_ACCESS_TOKEN y E2E_REFRESH_TOKEN.
 * Para obtenerlos: npm run e2e:auth (ejecuta login por API y luego Playwright con esos tokens).
 * Credenciales en frontend/.env.e2e (E2E_USER, E2E_PASSWORD, E2E_MFA_SECRET opcional).
 */
import { test, expect } from '@playwright/test';

const E2E_ACCESS_TOKEN = process.env.E2E_ACCESS_TOKEN ?? '';
const E2E_REFRESH_TOKEN = process.env.E2E_REFRESH_TOKEN ?? '';

async function loginAsAdmin(
  page: import('@playwright/test').Page,
  testInfo: import('@playwright/test').TestInfo
) {
  if (!E2E_ACCESS_TOKEN || !E2E_REFRESH_TOKEN) {
    testInfo.skip(
      true,
      'Faltan E2E_ACCESS_TOKEN y E2E_REFRESH_TOKEN. Ejecuta: npm run e2e:auth (desde frontend/)'
    );
    return;
  }
  await page.goto('/');
  await page.evaluate(
    (t: { accessToken: string; refreshToken: string }) => {
      localStorage.setItem('accessToken', t.accessToken);
      localStorage.setItem('refreshToken', t.refreshToken);
    },
    { accessToken: E2E_ACCESS_TOKEN, refreshToken: E2E_REFRESH_TOKEN }
  );
  await page.goto('/admin/departamentos');
  await expect(page).toHaveURL(/\/admin\/departamentos/);
}

test.describe('CRUD Departamentos', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await loginAsAdmin(page, testInfo);
  });

  test('listado de departamentos carga tras login', async ({ page }) => {
    await page.goto('/admin/departamentos');
    await expect(page).toHaveURL(/\/admin\/departamentos/);
    await expect(page.getByRole('heading', { name: /departamentos/i })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/gestiona los departamentos/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('crear departamento y verlo en la lista', async ({ page }) => {
    const nombre = `E2E Dept ${Date.now()}`;
    const codigo = `E2E${Date.now().toString().slice(-4)}`;

    await page.goto('/admin/departamentos');
    await expect(page.getByRole('button', { name: /crear departamento/i })).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole('button', { name: /crear departamento/i }).click();
    await expect(page.getByRole('dialog').getByText(/crear departamento/i)).toBeVisible({
      timeout: 5000,
    });
    await page.getByLabel(/nombre/i).fill(nombre);
    await page.getByLabel(/código/i).fill(codigo);
    await page.getByRole('button', { name: /^crear$/i }).click();
    await expect(page.getByText(nombre)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(codigo)).toBeVisible({ timeout: 5000 });
  });
});
