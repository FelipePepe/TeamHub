/**
 * E2E: Login (Fase 7).
 * Flujo: cargar /login, ver formulario, credenciales inválidas muestran error.
 */
import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('carga la página de login y muestra formulario', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByText(/ingresa tus credenciales/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder('********')).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar sesion/i })).toBeVisible();
  });

  test('muestra error con credenciales inválidas', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email/i).fill('nouser@example.com');
    await page.getByPlaceholder('********').fill('WrongPass123!');
    await page.getByRole('button', { name: /iniciar sesion/i }).click();

    await expect(page.getByText(/error|incorrecto|inválid|credenciales/i)).toBeVisible({ timeout: 10000 });
  });
});
