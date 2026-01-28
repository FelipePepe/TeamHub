import type { Hono } from 'hono';
import type { HonoEnv } from '../types/hono.js';
import dotenv from 'dotenv';
import { store } from '../store/index.js';
const TEST_ENV: Record<string, string> = {
  NODE_ENV: 'test',
  PORT: '3001',
  DATABASE_URL: 'postgres://localhost:5432/teamhub_test',
  PG_SSL_CERT_PATH: '',
  JWT_ACCESS_SECRET: 'test-access-secret-000000000000000000000000000000',
  JWT_REFRESH_SECRET: 'test-refresh-secret-000000000000000000000000000000',
  CORS_ORIGINS: 'http://localhost:3000',
  SMTP_HOST: 'localhost',
  SMTP_PORT: '1025',
  SMTP_USER: 'user',
  SMTP_PASS: 'pass',
  SMTP_FROM: 'noreply@example.com',
  APP_BASE_URL: 'http://localhost:3000',
  BCRYPT_SALT_ROUNDS: '4',
  MFA_ENCRYPTION_KEY: 'test-mfa-encryption-key-0000000000000000000000000000',
  BOOTSTRAP_TOKEN: 'test-bootstrap-token-000000000000000000000000000000',
};

export const applyTestEnv = () => {
  dotenv.config({ path: '.env.test' });
  Object.entries(TEST_ENV).forEach(([key, value]) => {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
};

export const resetStore = () => {
  store.users.clear();
  store.departamentos.clear();
  store.plantillas.clear();
  store.tareasPlantilla.clear();
  store.procesos.clear();
  store.tareasOnboarding.clear();
  store.proyectos.clear();
  store.asignaciones.clear();
  store.timetracking.clear();
  store.refreshTokens.clear();
  store.resetTokens.clear();
};

export const JSON_HEADERS = { 'Content-Type': 'application/json' };

let dbCache: typeof import('../db/index.js') | null = null;
let migrationsApplied = false;

const getDb = async () => {
  if (!dbCache) {
    dbCache = await import('../db/index.js');
  }
  return dbCache;
};

export const migrateTestDatabase = async () => {
  if (migrationsApplied) return;
  const { db } = await getDb();
  const { sql } = await import('drizzle-orm');
  await db.execute(sql`SELECT pg_advisory_lock(424242)`);
  const { migrate } = await import('drizzle-orm/node-postgres/migrator');
  try {
    await migrate(db, { migrationsFolder: 'src/db/migrations' });
    migrationsApplied = true;
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(424242)`);
  }
};

export const resetDatabase = async () => {
  const { db } = await getDb();
  const { sql } = await import('drizzle-orm');
  await db.execute(sql`
    TRUNCATE TABLE
      "audit_log",
      "timetracking",
      "asignaciones",
      "proyectos",
      "tareas_onboarding",
      "procesos_onboarding",
      "tareas_plantilla",
      "plantillas_onboarding",
      "departamentos",
      "password_reset_tokens",
      "refresh_tokens",
      "users"
    RESTART IDENTITY CASCADE
  `);
};

export const findUserByEmail = async (email: string) => {
  const { db } = await getDb();
  const { users } = await import('../db/schema/users.js');
  const { eq } = await import('drizzle-orm');
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return rows[0] ?? null;
};

export const loginWithMfa = async (
  app: Hono<HonoEnv>,
  email: string,
  password: string
) => {
  const bootstrapToken = process.env.BOOTSTRAP_TOKEN;
  const headers = bootstrapToken
    ? { ...JSON_HEADERS, 'X-Bootstrap-Token': bootstrapToken }
    : JSON_HEADERS;

  const loginResponse = await app.request('/api/auth/login', {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password }),
  });
  const loginBody = await loginResponse.json();

  const mfaToken = loginBody.mfaToken as string;
  const setupResponse = await app.request('/api/auth/mfa/setup', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${mfaToken}`,
    },
  });
  const setupBody = await setupResponse.json();

  const { generateTotpCode } = await import('../services/mfa-service.js');
  const code = generateTotpCode(setupBody.secret as string);
  const verifyResponse = await app.request('/api/auth/mfa/verify', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ mfaToken, code }),
  });
  const verifyBody = await verifyResponse.json();

  return {
    loginResponse,
    loginBody,
    setupResponse,
    setupBody,
    verifyResponse,
    verifyBody,
  };
};
