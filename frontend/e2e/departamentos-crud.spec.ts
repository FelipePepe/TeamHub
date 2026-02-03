/**
 * E2E: CRUD Departamentos (Fase 7).
 * Usa login por API + sesión inyectada para evitar flakiness por rate-limit en UI auth.
 */
import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

loadEnvFile(path.resolve(process.cwd(), '..'), '.env');
loadEnvFile(process.cwd(), '.env');
loadEnvFile(process.cwd(), '.env.local');
loadEnvFile(process.cwd(), '.env.e2e');

const E2E_USER = process.env.E2E_USER?.trim() ?? '';
const E2E_PASSWORD = process.env.E2E_PASSWORD?.trim() ?? '';
type AuthTokens = { accessToken: string; refreshToken: string };

function loadEnvFile(dir: string, name: string) {
  const file = path.join(dir, name);
  if (!existsSync(file)) return;
  const raw = readFileSync(file, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function applySession(
  page: import('@playwright/test').Page,
  tokens: AuthTokens,
  targetPath: string
) {
  await page.goto('/login');
  await page.evaluate(
    (sessionTokens: AuthTokens) => {
      localStorage.setItem('accessToken', sessionTokens.accessToken);
      localStorage.setItem('refreshToken', sessionTokens.refreshToken);
    },
    tokens
  );
  await page.goto(targetPath);
}

async function loginAdminWithRetry(maxAttempts = 3): Promise<AuthTokens> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await loginViaApiWithHelper(E2E_USER, E2E_PASSWORD);
    } catch (error) {
      lastError = error as Error;
      const message = lastError.message ?? '';
      if (!message.includes('429') || attempt === maxAttempts) {
        break;
      }
      const retryAfterMatch = message.match(/"retryAfter":\s*(\d+)/);
      const retryAfterSeconds = retryAfterMatch ? Number.parseInt(retryAfterMatch[1], 10) : 5;
      await new Promise((resolve) => setTimeout(resolve, (retryAfterSeconds + 1) * 1000));
    }
  }
  throw lastError ?? new Error('No se pudo iniciar sesión admin por API');
}

async function loginViaApiWithHelper(email: string, password: string): Promise<AuthTokens> {
  const authHelper = await import('./helpers/auth-api.mjs');
  return authHelper.loginViaApi(email, password) as Promise<AuthTokens>;
}

test.describe('CRUD Departamentos', () => {
  test.describe.configure({ mode: 'serial' });
  let adminTokens: AuthTokens | null = null;
  let setupError: string | null = null;

  test.beforeAll(async () => {
    if (!E2E_USER || !E2E_PASSWORD) {
      setupError = 'Faltan E2E_USER/E2E_PASSWORD en frontend/.env.e2e';
      return;
    }

    try {
      adminTokens = await loginAdminWithRetry();
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
