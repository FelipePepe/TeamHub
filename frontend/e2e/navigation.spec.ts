/**
 * E2E: Navegación (Fase 7).
 * Flujo: sin auth, /login redirige o muestra login; rutas protegidas redirigen a login.
 */
import { test, expect } from '@playwright/test';

test.describe('Navegación', () => {
  test('ruta raíz redirige o muestra contenido', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/(login|dashboard|$)/);
  });

  test('ruta /login es accesible sin autenticación', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible({ timeout: 10000 });
  });
});
