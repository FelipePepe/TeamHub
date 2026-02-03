/**
 * E2E: CRUD Departamentos (Fase 7).
 * Usa login por API + sesión inyectada para evitar flakiness por rate-limit en UI auth.
 */
import { test, expect } from '@playwright/test';
import { applySession, getAdminTokens, type AuthTokens } from './helpers/e2e-session';

test.describe('CRUD Departamentos', () => {
  test.describe.configure({ mode: 'serial' });
  let adminTokens: AuthTokens | null = null;
  let setupError: string | null = null;

  test.beforeAll(async () => {
    try {
      adminTokens = await getAdminTokens();
    } catch (error) {
      setupError = `No se pudo iniciar sesión admin: ${(error as Error).message}`;
    }
  });

  test.beforeEach(async ({ page }) => {
    if (!adminTokens || setupError) {
      throw new Error(setupError ?? 'Sesión admin no inicializada');
    }
    await applySession(page, adminTokens, '/admin/departamentos');
    await expect(page).toHaveURL(/\/admin\/departamentos/, { timeout: 10000 });
  });

  test('listado de departamentos carga tras login', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /departamentos/i })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/gestiona los departamentos/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('crear departamento y verlo en la lista', async ({ page }) => {
    const uniqueId = Date.now();
    const nombre = `E2E Dept ${uniqueId}`;
    const codigo = `E2E${String(uniqueId).slice(-4)}`;

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
