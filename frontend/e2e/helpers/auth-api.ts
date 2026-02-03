/**
 * Helper E2E: login contra el backend por API (login + MFA setup + verify)
 * y devolver tokens para inyectar en el navegador.
 * Requiere backend en marcha y usuario existente (o bootstrap con E2E_BOOTSTRAP_TOKEN).
 * Carga .env con parser propio (sin dotenv). TOTP con Node crypto (sin otplib) para evitar ESM/CommonJS.
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';
import { createHmac } from 'node:crypto';
import type { BinaryLike } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function fromBase32(input: string): Buffer {
  const normalized = input.replace(/=+$/g, '').toUpperCase();
  let bits = '';
  for (const char of normalized) {
    const index = BASE32.indexOf(char);
    if (index === -1) throw new Error('Invalid base32 character');
    bits += index.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let offset = 0; offset + 8 <= bits.length; offset += 8) {
    bytes.push(Number.parseInt(bits.slice(offset, offset + 8), 2));
  }
  return Buffer.from(bytes);
}

export function generateTotpCode(secret: string, timestampMs = Date.now()): string {
  const counter = Math.floor(timestampMs / (TOTP_STEP_SECONDS * 1000));
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const key = fromBase32(secret);
  const hmac = createHmac('sha1', key as BinaryLike).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 10 ** TOTP_DIGITS;
  return code.toString().padStart(TOTP_DIGITS, '0');
}

const frontendRoot = path.resolve(__dirname, '../..');
const projectRoot = path.resolve(frontendRoot, '..');

function loadEnvFile(dir: string, name: string): void {
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

loadEnvFile(projectRoot, '.env');
loadEnvFile(frontendRoot, '.env');
loadEnvFile(frontendRoot, '.env.local');
loadEnvFile(frontendRoot, '.env.e2e');

function promptMfaCode(): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Código MFA (6 dígitos de tu app): ', (answer) => {
      rl.close();
      resolve(answer.replace(/\s/g, '').slice(0, 6));
    });
  });
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const HMAC_SECRET =
  process.env.NEXT_PUBLIC_API_HMAC_SECRET ?? process.env.API_HMAC_SECRET ?? '';

function signRequest(method: string, path: string): string {
  const timestamp = Date.now();
  const message = `${timestamp}${method}${path}`;
  const signature = createHmac('sha256', HMAC_SECRET).update(message).digest('hex');
  return `t=${timestamp},s=${signature}`;
}

export async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  bearer?: string
): Promise<T> {
  const pathForSign = path.startsWith('/api') ? path : `/api${path}`;
  const url = path.startsWith('http') ? path : `${API_BASE.replace(/\/api\/?$/, '')}${pathForSign}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-Signature': signRequest(method, pathForSign),
  };
  if (bearer) headers['Authorization'] = `Bearer ${bearer}`;
  const bootstrap = process.env.E2E_BOOTSTRAP_TOKEN;
  if (bootstrap) headers['X-Bootstrap-Token'] = bootstrap;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    const hint =
      res.status === 401 && path.includes('auth/login')
        ? ' Comprueba: (1) NEXT_PUBLIC_API_HMAC_SECRET en frontend/.env igual que API_HMAC_SECRET en backend, (2) E2E_USER/E2E_PASSWORD en .env.e2e correctos.'
        : '';
    throw new Error(`API ${method} ${path}: ${res.status} ${text}.${hint}`);
  }
  return res.json() as Promise<T>;
}

export type AuthTokens = { accessToken: string; refreshToken: string };

/**
 * Login por API (login → mfa/setup si aplica → mfa/verify) y devuelve tokens.
 */
export async function loginViaApi(
  email: string,
  password: string
): Promise<AuthTokens> {
  const loginBody = (await apiRequest<{
    mfaToken?: string;
    mfaSetupRequired?: boolean;
    mfaRequired?: boolean;
    accessToken?: string;
    refreshToken?: string;
  }>('POST', '/auth/login', { email, password })) as {
    mfaToken?: string;
    mfaSetupRequired?: boolean;
    mfaRequired?: boolean;
    accessToken?: string;
    refreshToken?: string;
  };

  const mfaToken = loginBody.mfaToken;
  if (!mfaToken) {
    if (loginBody.accessToken && loginBody.refreshToken) {
      return {
        accessToken: loginBody.accessToken,
        refreshToken: loginBody.refreshToken,
      };
    }
    throw new Error('Login response missing mfaToken and tokens');
  }

  let code: string;

  if (loginBody.mfaSetupRequired) {
    // Primer login o usuario sin MFA: setup devuelve el secret, generamos TOTP y verificamos
    const setupBody = (await apiRequest<{ secret: string }>(
      'POST',
      '/auth/mfa/setup',
      {},
      mfaToken
    )) as { secret: string };
    code = generateTotpCode(setupBody.secret);
  } else if (loginBody.mfaRequired) {
    // Usuario ya tiene MFA: E2E_MFA_SECRET para generar código, o pedir código por terminal
    const envSecret = process.env.E2E_MFA_SECRET?.trim();
    if (envSecret) {
      code = generateTotpCode(envSecret);
    } else if (process.stdin.isTTY && process.stdout.isTTY) {
      console.log('\n[E2E] Usuario con MFA activo. Introduce el código actual de tu app de autenticación.\n');
      code = await promptMfaCode();
    } else {
      throw new Error(
        'Usuario tiene MFA activo. Añade E2E_MFA_SECRET en frontend/.env.e2e o ejecuta los tests en una terminal interactiva para introducir el código.'
      );
    }
  } else {
    throw new Error('Login response: mfaSetupRequired y mfaRequired no presentes');
  }

  const verifyBody = (await apiRequest<{ accessToken: string; refreshToken: string }>(
    'POST',
    '/auth/mfa/verify',
    { mfaToken, code }
  )) as { accessToken: string; refreshToken: string };
  return {
    accessToken: verifyBody.accessToken,
    refreshToken: verifyBody.refreshToken,
  };
}
