import { test, expect } from '@playwright/test';
import { createHmac } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

loadEnvFile(path.resolve(process.cwd(), '..'), '.env');
loadEnvFile(process.cwd(), '.env');
loadEnvFile(process.cwd(), '.env.local');
loadEnvFile(process.cwd(), '.env.e2e');

const E2E_USER = process.env.E2E_USER ?? '';
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? '';
const E2E_MFA_SECRET = process.env.E2E_MFA_SECRET ?? '';

const E2E_EMPLOYEE_USER = process.env.E2E_EMPLOYEE_USER ?? '';
const E2E_EMPLOYEE_PASSWORD = process.env.E2E_EMPLOYEE_PASSWORD ?? '';
const E2E_EMPLOYEE_MFA_SECRET = process.env.E2E_EMPLOYEE_MFA_SECRET ?? '';
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const HMAC_SECRET =
  process.env.NEXT_PUBLIC_API_HMAC_SECRET ?? process.env.API_HMAC_SECRET ?? '';
type AuthTokens = { accessToken: string; refreshToken: string };

function loadEnvFile(dir: string, name: string) {
  const file = path.join(dir, name);
  if (!existsSync(file)) return;
  const raw = readFileSync(file, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

test.describe('Bloque A E2E (P0)', () => {
  test.describe.configure({ mode: 'serial' });
  let adminTokens: AuthTokens | null = null;
  let adminSetupError: string | null = null;
  let employeeTokens: AuthTokens | null = null;
  let employeeSetupError: string | null = null;

  test.beforeAll(async ({ browser }) => {
    if (!E2E_USER || !E2E_PASSWORD || !E2E_MFA_SECRET) {
      adminSetupError = 'Faltan E2E_USER/E2E_PASSWORD/E2E_MFA_SECRET para inicializar sesion admin';
      return;
    }
    if (!HMAC_SECRET) {
      adminSetupError =
        'Falta NEXT_PUBLIC_API_HMAC_SECRET/API_HMAC_SECRET para llamadas API E2E';
      return;
    }

    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      adminTokens = await loginViaUi(page, {
        email: E2E_USER,
        password: E2E_PASSWORD,
        mfaSecret: E2E_MFA_SECRET,
      });
    } catch (error) {
      adminSetupError = `No se pudo iniciar sesion admin: ${(error as Error).message}`;
    } finally {
      await context.close();
    }

    const employeeSecret = E2E_EMPLOYEE_MFA_SECRET || E2E_MFA_SECRET;
    if (E2E_EMPLOYEE_USER && E2E_EMPLOYEE_PASSWORD && employeeSecret) {
      const employeeContext = await browser.newContext();
      const employeePage = await employeeContext.newPage();
      try {
        employeeTokens = await loginViaUi(employeePage, {
          email: E2E_EMPLOYEE_USER,
          password: E2E_EMPLOYEE_PASSWORD,
          mfaSecret: employeeSecret,
        });
      } catch (error) {
        employeeSetupError = `No se pudo iniciar sesion EMPLEADO: ${(error as Error).message}`;
      } finally {
        await employeeContext.close();
      }
      return;
    }

    try {
      employeeTokens = await provisionEmployeeSession(adminTokens);
    } catch (error) {
      employeeSetupError = `No se pudo provisionar EMPLEADO E2E: ${(error as Error).message}`;
    }
  });

  test('E2E-AUTH-003: login UI con MFA redirige a dashboard', async ({ page }, testInfo) => {
    if (!E2E_USER || !E2E_PASSWORD || !E2E_MFA_SECRET) {
      testInfo.skip(true, 'Faltan E2E_USER/E2E_PASSWORD/E2E_MFA_SECRET para flujo MFA por UI');
      return;
    }

    await loginViaUi(page, {
      email: E2E_USER,
      password: E2E_PASSWORD,
      mfaSecret: E2E_MFA_SECRET,
    });
  });

  test('E2E-NAV-002: ADMIN ve navegacion completa de gestion', async ({ page }, testInfo) => {
    if (!adminTokens || adminSetupError) {
      throw new Error(adminSetupError ?? 'Sin sesion admin inicializada');
    }

    await applySession(page, adminTokens, '/dashboard');

    const nav = page.getByRole('navigation', { name: /navegación principal/i });
    await expect(nav.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Departamentos' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Empleados' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Plantillas' })).toBeVisible();
  });

  test('E2E-NAV-002 + E2E-DEP-006: EMPLEADO no ve nav admin ni accede a departamentos', async ({ page }, testInfo) => {
    if (!employeeTokens || employeeSetupError) {
      throw new Error(employeeSetupError ?? 'No fue posible inicializar sesion de empleado');
    }

    await applySession(page, employeeTokens, '/dashboard');

    const nav = page.getByRole('navigation', { name: /navegación principal/i });
    await expect(nav.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Proyectos' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Timetracking' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Departamentos' })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Empleados' })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: 'Plantillas' })).toHaveCount(0);

    await page.goto('/admin/departamentos');
    await expect(page.getByText(/acceso denegado/i)).toBeVisible({ timeout: 10000 });
  });

  test('E2E-PRJ-001: crear proyecto y verificarlo en listado', async ({ page }, testInfo) => {
    if (!adminTokens || adminSetupError) {
      throw new Error(adminSetupError ?? 'Sin sesion admin inicializada');
    }

    await applySession(page, adminTokens, '/dashboard');
    const proyecto = await createProjectViaUi(page);

    await page.goto('/proyectos');
    await page.getByPlaceholder(/buscar por nombre, código o cliente/i).fill(proyecto.codigo);
    await expect(page.getByText(proyecto.codigo)).toBeVisible({ timeout: 10000 });
  });

  test('E2E-TTR-001: crear registro de horas pendiente', async ({ page }, testInfo) => {
    if (!adminTokens || adminSetupError) {
      throw new Error(adminSetupError ?? 'Sin sesion admin inicializada');
    }

    await applySession(page, adminTokens, '/dashboard');
    const suffix = Date.now();
    const proyecto = await apiRequest<{ id: string }>(
      'POST',
      '/proyectos',
      {
        nombre: `E2E API Proyecto ${suffix}`,
        codigo: `E2EAPI${String(suffix).slice(-6)}`,
      },
      adminTokens.accessToken
    );
    const descripcion = `E2E registro ${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);

    const created = await apiRequest<{
      id: string;
      estado: string;
      descripcion: string;
    }>(
      'POST',
      '/timetracking',
      {
        proyectoId: proyecto.id,
        fecha: today,
        horas: 1,
        descripcion,
        facturable: true,
      },
      adminTokens.accessToken
    );
    expect(created.estado).toBe('PENDIENTE');

    await page.goto('/timetracking');
    await expect(page.getByText(descripcion)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('PENDIENTE').first()).toBeVisible({ timeout: 10000 });
  });
});

async function provisionEmployeeSession(adminTokens: AuthTokens): Promise<AuthTokens> {
  const suffix = Date.now();
  const email = `e2e.employee.${suffix}@example.com`;
  const initialPassword = `InitPass!${suffix}Aa`;
  const newPassword = `NewPass!${suffix}Bb`;

  await apiRequest(
    'POST',
    '/usuarios',
    {
      email,
      password: initialPassword,
      nombre: 'E2E',
      apellidos: 'Empleado',
      rol: 'EMPLEADO',
    },
    adminTokens.accessToken
  );

  const loginBody = await apiRequest<{
    mfaToken?: string;
    passwordChangeRequired?: boolean;
    mfaSetupRequired?: boolean;
    mfaRequired?: boolean;
  }>('POST', '/auth/login', { email, password: initialPassword });
  let mfaToken = loginBody.mfaToken;
  if (!mfaToken) {
    throw new Error('Login empleado sin mfaToken');
  }

  if (loginBody.passwordChangeRequired) {
    const changeBody = await apiRequest<{ mfaToken?: string; mfaSetupRequired?: boolean }>(
      'POST',
      '/auth/change-password',
      { mfaToken, newPassword }
    );
    mfaToken = changeBody.mfaToken ?? mfaToken;
  }

  const setupBody = await apiRequest<{ secret: string }>(
    'POST',
    '/auth/mfa/setup',
    {},
    mfaToken
  );
  const code = generateTotpCode(setupBody.secret);

  const verifyBody = await apiRequest<AuthTokens>(
    'POST',
    '/auth/mfa/verify',
    { mfaToken, code }
  );
  return verifyBody;
}

async function apiRequest<T>(
  method: string,
  pathForApi: string,
  body?: unknown,
  bearer?: string
): Promise<T> {
  const pathForSign = pathForApi.startsWith('/api') ? pathForApi : `/api${pathForApi}`;
  const base = API_BASE.replace(/\/api\/?$/, '');
  const url = `${base}${pathForSign}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-Signature': signRequest(method, pathForSign),
  };
  if (bearer) {
    headers.Authorization = `Bearer ${bearer}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${method} ${pathForApi}: ${response.status} ${text}`);
  }
  return response.json() as Promise<T>;
}

function signRequest(method: string, pathForSign: string): string {
  const timestamp = Date.now();
  const message = `${timestamp}${method}${pathForSign}`;
  const signature = createHmac('sha256', HMAC_SECRET).update(message).digest('hex');
  return `t=${timestamp},s=${signature}`;
}

async function loginViaUi(
  page: import('@playwright/test').Page,
  creds: { email: string; password: string; mfaSecret: string }
): Promise<AuthTokens> {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(creds.email);
  await page.getByPlaceholder('********').fill(creds.password);
  let loginResponse: import('@playwright/test').Response | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const loginResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/auth/login') &&
        response.request().method() === 'POST'
    );
    await page.locator('form').first().evaluate((form) => (form as HTMLFormElement).requestSubmit());
    loginResponse = await loginResponsePromise;

    if (loginResponse.status() !== 429) {
      break;
    }
    const bodyText = await loginResponse.text();
    const retryAfterMatch = bodyText.match(/"retryAfter":\s*(\d+)/);
    const retryAfterSeconds = retryAfterMatch ? Number.parseInt(retryAfterMatch[1], 10) : 5;
    await page.waitForTimeout((retryAfterSeconds + 1) * 1000);
  }

  if (!loginResponse || !loginResponse.ok()) {
    const status = loginResponse ? loginResponse.status() : 'NO_RESPONSE';
    const body = loginResponse ? await loginResponse.text() : '';
    throw new Error(`Login UI fallido: ${status} ${body}`);
  }

  const mfaInput = page.locator('#mfa-code');
  const hasMfaInput = await mfaInput.isVisible({ timeout: 10000 }).catch(() => false);
  if (hasMfaInput) {
    await mfaInput.fill(generateTotpCode(creds.mfaSecret));
    await mfaInput.locator('xpath=ancestor::form').evaluate((form) =>
      (form as HTMLFormElement).requestSubmit()
    );

    const reachedDashboard = await page
      .waitForURL(/\/dashboard/, { timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    if (!reachedDashboard && (await mfaInput.isVisible().catch(() => false))) {
      // Retry once in case the first TOTP expired during submission window.
      await mfaInput.fill(generateTotpCode(creds.mfaSecret));
      await mfaInput.locator('xpath=ancestor::form').evaluate((form) =>
        (form as HTMLFormElement).requestSubmit()
      );
    }
  }

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  await expect(page.getByText(/panel de/i)).toBeVisible({ timeout: 10000 });

  const tokens = await page.evaluate(() => ({
    accessToken: localStorage.getItem('accessToken') ?? '',
    refreshToken: localStorage.getItem('refreshToken') ?? '',
  }));
  if (!tokens.accessToken || !tokens.refreshToken) {
    throw new Error('No se encontraron tokens en localStorage tras login MFA');
  }
  return tokens;
}

async function applySession(
  page: import('@playwright/test').Page,
  tokens: AuthTokens,
  targetPath = '/dashboard'
) {
  await page.goto('/login');
  await page.evaluate(
    (t: AuthTokens) => {
      localStorage.setItem('accessToken', t.accessToken);
      localStorage.setItem('refreshToken', t.refreshToken);
    },
    tokens
  );
  await page.goto(targetPath);
}

async function createProjectViaUi(page: import('@playwright/test').Page) {
  const suffix = Date.now();
  const nombre = `E2E Proyecto ${suffix}`;
  const codigo = `E2EPRJ${String(suffix).slice(-6)}`;

  await page.goto('/proyectos/crear');
  await expect(page.getByRole('heading', { name: /crear proyecto/i })).toBeVisible({
    timeout: 10000,
  });
  await page.locator('#nombre').fill(nombre);
  await page.locator('#codigo').fill(codigo);
  await page.getByRole('button', { name: /crear proyecto/i }).click();
  await expect(page).toHaveURL(/\/proyectos\/[^/]+$/, { timeout: 15000 });

  const match = page.url().match(/\/proyectos\/([^/?#]+)/);
  if (!match?.[1]) {
    throw new Error(`No se pudo obtener el id de proyecto desde URL: ${page.url()}`);
  }

  return {
    id: match[1],
    nombre,
    codigo,
  };
}

function fromBase32(input: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const normalized = input.replace(/=+$/g, '').toUpperCase();
  let bits = '';

  for (const char of normalized) {
    const index = alphabet.indexOf(char);
    if (index === -1) {
      throw new Error('Invalid base32 character in MFA secret');
    }
    bits += index.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let offset = 0; offset + 8 <= bits.length; offset += 8) {
    bytes.push(Number.parseInt(bits.slice(offset, offset + 8), 2));
  }

  return Buffer.from(bytes);
}

function generateTotpCode(secret: string, timestampMs = Date.now()): string {
  const stepSeconds = 30;
  const digits = 6;
  const counter = Math.floor(timestampMs / (stepSeconds * 1000));
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const key = fromBase32(secret);
  const hmac = createHmac('sha1', key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 10 ** digits;

  return code.toString().padStart(digits, '0');
}
