import type { Page } from '@playwright/test';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { generateTotpCode } from './totp-shared';

export type AuthTokens = { accessToken: string; refreshToken: string };

interface AuthApiHelper {
  apiRequest: <T>(
    method: string,
    pathForApi: string,
    body?: unknown,
    bearer?: string
  ) => Promise<T>;
  loginViaApi: (email: string, password: string) => Promise<AuthTokens>;
}

loadEnvFile(path.resolve(process.cwd(), '..'), '.env');
loadEnvFile(process.cwd(), '.env');
loadEnvFile(process.cwd(), '.env.local');
loadEnvFile(process.cwd(), '.env.e2e');

const E2E_USER = process.env.E2E_USER?.trim() ?? '';
const E2E_PASSWORD = process.env.E2E_PASSWORD?.trim() ?? '';

let cachedAdminTokens: AuthTokens | null = null;
let cachedHelperModule: Promise<AuthApiHelper> | null = null;
const TOKEN_CACHE_FILE = path.join(os.tmpdir(), 'teamhub-e2e-admin-session-cache.json');
const TOKEN_CACHE_MAX_AGE_MS = 10 * 60 * 1000;

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

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function getStatusCodeFromError(error: unknown): number | null {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(/:\s(\d{3})\s/);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

export function getRetryAfterSecondsFromError(error: unknown): number {
  const message = error instanceof Error ? error.message : String(error);
  const match = message.match(/"retryAfter":\s*(\d+)/);
  if (!match) return 5;
  return Number.parseInt(match[1], 10);
}

export async function getAuthApiHelper(): Promise<AuthApiHelper> {
  if (!cachedHelperModule) {
    cachedHelperModule = import('./auth-api.mjs') as Promise<AuthApiHelper>;
  }
  return cachedHelperModule;
}

export async function loginViaApiWithRetry(
  email: string,
  password: string,
  maxAttempts = 5
): Promise<AuthTokens> {
  const helper = await getAuthApiHelper();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await helper.loginViaApi(email, password);
    } catch (error) {
      lastError = error as Error;
      if (getStatusCodeFromError(error) !== 429 || attempt === maxAttempts) {
        break;
      }
      const retryAfterSeconds = getRetryAfterSecondsFromError(error);
      await sleep((retryAfterSeconds + 1) * 1000);
    }
  }

  throw lastError ?? new Error('No se pudo iniciar sesion por API');
}

export async function getAdminTokens(forceRefresh = false): Promise<AuthTokens> {
  if (!E2E_USER || !E2E_PASSWORD) {
    throw new Error('Faltan E2E_USER/E2E_PASSWORD en frontend/.env.e2e');
  }

  if (!forceRefresh && cachedAdminTokens) {
    return cachedAdminTokens;
  }

  if (!forceRefresh && existsSync(TOKEN_CACHE_FILE)) {
    try {
      const cachedRaw = readFileSync(TOKEN_CACHE_FILE, 'utf8');
      const cached = JSON.parse(cachedRaw) as AuthTokens & { createdAt: number };
      if (
        cached.accessToken &&
        cached.refreshToken &&
        Date.now() - cached.createdAt < TOKEN_CACHE_MAX_AGE_MS
      ) {
        cachedAdminTokens = {
          accessToken: cached.accessToken,
          refreshToken: cached.refreshToken,
        };
        return cachedAdminTokens;
      }
    } catch {
      // Ignorar cache inválido y continuar con login.
    }
  }

  cachedAdminTokens = await loginViaApiWithRetry(E2E_USER, E2E_PASSWORD);
  try {
    writeFileSync(
      TOKEN_CACHE_FILE,
      JSON.stringify({
        ...cachedAdminTokens,
        createdAt: Date.now(),
      }),
      'utf8'
    );
  } catch {
    // Si no se puede persistir cache, la suite sigue usando memoria de proceso.
  }
  return cachedAdminTokens;
}

export async function applySession(
  page: Page,
  tokens: AuthTokens,
  targetPath = '/dashboard'
) {
  await page.goto('/login');
  await page.evaluate(
    (sessionTokens: AuthTokens) => {
      localStorage.setItem('accessToken', sessionTokens.accessToken);
      localStorage.setItem('refreshToken', sessionTokens.refreshToken);
    },
    tokens
  );  await page.goto(targetPath);
}

// ============ Employee provisioning ============

async function apiRequestWithRetry<T>(
  method: string,
  pathForApi: string,
  body?: unknown,
  bearer?: string,
  maxAttempts = 5
): Promise<T> {
  const helper = await getAuthApiHelper();
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await helper.apiRequest<T>(method, pathForApi, body, bearer);
    } catch (error) {
      lastError = error as Error;
      if (getStatusCodeFromError(error) !== 429 || attempt === maxAttempts) {
        break;
      }
      const retryAfterSeconds = getRetryAfterSecondsFromError(error);
      await sleep((retryAfterSeconds + 1) * 1000);
    }
  }
  throw lastError ?? new Error(`API ${method} ${pathForApi} falló sin detalle`);
}

/**
 * Crea un usuario EMPLEADO por API, hace login, change-password, MFA setup/verify
 * y devuelve AuthTokens listos para usar con applySession().
 */
export async function provisionEmployeeSession(adminAccessToken: string): Promise<AuthTokens> {
  const suffix = Date.now();
  const email = `e2e.employee.${suffix}@example.com`;
  const initialPassword = `InitPass!${suffix}Aa`;
  const newPassword = `NewPass!${suffix}Bb`;

  // 1. Crear usuario empleado
  await apiRequestWithRetry(
    'POST',
    '/usuarios',
    {
      email,
      password: initialPassword,
      nombre: 'E2E',
      apellidos: 'Empleado',
      rol: 'EMPLEADO',
    },
    adminAccessToken
  );

  // 2. Login con credenciales iniciales
  const loginBody = await apiRequestWithRetry<{
    mfaToken?: string;
    passwordChangeRequired?: boolean;
    mfaSetupRequired?: boolean;
    mfaRequired?: boolean;
  }>('POST', '/auth/login', { email, password: initialPassword });

  let mfaToken = loginBody.mfaToken;
  if (!mfaToken) {
    throw new Error('Login empleado sin mfaToken');
  }

  // 3. Cambio de contraseña obligatorio
  if (loginBody.passwordChangeRequired) {
    const changeBody = await apiRequestWithRetry<{ mfaToken?: string; mfaSetupRequired?: boolean }>(
      'POST',
      '/auth/change-password',
      { mfaToken, newPassword }
    );
    mfaToken = changeBody.mfaToken ?? mfaToken;
  }

  // 4. MFA setup
  const setupBody = await apiRequestWithRetry<{ secret: string }>(
    'POST',
    '/auth/mfa/setup',
    {},
    mfaToken
  );
  const code = generateTotpCode(setupBody.secret);

  // 5. MFA verify → tokens finales
  const verifyBody = await apiRequestWithRetry<AuthTokens>(
    'POST',
    '/auth/mfa/verify',
    { mfaToken, code }
  );
  return verifyBody;
}
