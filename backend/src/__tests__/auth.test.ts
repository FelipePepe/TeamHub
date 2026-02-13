import type { HonoEnv } from '../types/hono.js';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Hono } from 'hono';
import {
  applyTestEnv,
  loginWithMfa,
  resetStore,
  resetDatabase,
  migrateTestDatabase,
  findUserByEmail,
  getSignedHeaders,
  extractCookies,
} from '../test-utils/index.js';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'ValidPassword1!';
let app: Hono<HonoEnv>;

beforeAll(async () => {
  applyTestEnv();
  await migrateTestDatabase();
  ({ default: app } = await import('../app.js'));
});

beforeEach(async () => {
  await resetDatabase();
  resetStore();
});

describe('auth routes', () => {
  it('bootstraps the first user on login', async () => {
    const { loginResponse, loginBody, verifyBody, cookies } = await loginWithMfa(
      app,
      ADMIN_EMAIL,
      ADMIN_PASSWORD
    );

    expect(loginResponse.status).toBe(200);
    expect(loginBody).toMatchObject({
      mfaSetupRequired: true,
      mfaToken: expect.any(String),
    });
    
    // Tokens ahora están en cookies httpOnly, NO en JSON response
    expect(verifyBody).toMatchObject({
      user: {
        email: ADMIN_EMAIL,
        nombre: 'Admin',
        rol: 'ADMIN',
        activo: true,
      },
    });
    
    // Verificar que las cookies fueron establecidas
    expect(cookies).toHaveProperty('access_token');
    expect(cookies).toHaveProperty('refresh_token');
    expect(cookies.access_token).toBeTruthy();
    expect(cookies.refresh_token).toBeTruthy();
    
    const storedUser = await findUserByEmail(ADMIN_EMAIL);
    expect(storedUser).toBeTruthy();
  });

  it('rejects /auth/me without authentication', async () => {
    const response = await app.request('/api/auth/me', {
      headers: getSignedHeaders('GET', '/api/auth/me'),
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toMatchObject({ error: 'No autorizado' });
  });

  it('revokes refresh tokens after use', async () => {
    const loginResult = await loginWithMfa(app, ADMIN_EMAIL, ADMIN_PASSWORD);
    const { cookies } = loginResult;

    // Primera vez: refresh debe funcionar (cookies enviadas automáticamente)
    const refreshResponse = await app.request('/api/auth/refresh', {
      method: 'POST',
      headers: getSignedHeaders('POST', '/api/auth/refresh', {}, cookies),
    });
    expect(refreshResponse.status).toBe(200);
    const refreshed = await refreshResponse.json();
    expect(refreshed).toMatchObject({
      success: true,
    });
    
    // Extraer nuevas cookies del refresh
    const newCookies = extractCookies(refreshResponse);
    expect(newCookies).toHaveProperty('access_token');
    expect(newCookies).toHaveProperty('refresh_token');

    // Segunda vez con el refresh token viejo: debe fallar (revocado)
    const reuseResponse = await app.request('/api/auth/refresh', {
      method: 'POST',
      headers: getSignedHeaders('POST', '/api/auth/refresh', {}, cookies),
    });
    expect(reuseResponse.status).toBe(401);
  });

  it('returns validation errors for malformed login payloads', async () => {
    const response = await app.request('/api/auth/login', {
      method: 'POST',
      headers: getSignedHeaders('POST', '/api/auth/login'),
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Datos de entrada invalidos');
    expect(Array.isArray(body.details)).toBe(true);
  });
});
