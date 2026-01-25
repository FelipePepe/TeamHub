import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Hono } from 'hono';
import {
  applyTestEnv,
  loginWithMfa,
  resetStore,
  resetDatabase,
  migrateTestDatabase,
  findUserByEmail,
  JSON_HEADERS,
} from '../test-utils';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'ValidPassword1!';
let app: Hono;

beforeAll(async () => {
  applyTestEnv();
  await migrateTestDatabase();
  ({ default: app } = await import('../app'));
});

beforeEach(async () => {
  await resetDatabase();
  resetStore();
});

describe('auth routes', () => {
  it('bootstraps the first user on login', async () => {
    const { loginResponse, loginBody, verifyBody } = await loginWithMfa(
      app,
      ADMIN_EMAIL,
      ADMIN_PASSWORD
    );

    expect(loginResponse.status).toBe(200);
    expect(loginBody).toMatchObject({
      mfaRequired: true,
      mfaToken: expect.any(String),
    });
    expect(verifyBody).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      user: {
        email: ADMIN_EMAIL,
        nombre: 'Admin',
        rol: 'ADMIN',
        activo: true,
      },
    });
    const storedUser = await findUserByEmail(ADMIN_EMAIL);
    expect(storedUser).toBeTruthy();
  });

  it('rejects /auth/me without authentication', async () => {
    const response = await app.request('/api/auth/me');

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toMatchObject({ error: 'No autorizado' });
  });

  it('revokes refresh tokens after use', async () => {
    const loginResult = await loginWithMfa(app, ADMIN_EMAIL, ADMIN_PASSWORD);
    const refreshToken = loginResult.verifyBody.refreshToken as string;

    const refreshResponse = await app.request('/api/auth/refresh', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ refreshToken }),
    });
    expect(refreshResponse.status).toBe(200);
    const refreshed = await refreshResponse.json();
    expect(refreshed).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });

    const reuseResponse = await app.request('/api/auth/refresh', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ refreshToken }),
    });
    expect(reuseResponse.status).toBe(401);
  });

  it('returns validation errors for malformed login payloads', async () => {
    const response = await app.request('/api/auth/login', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Datos de entrada invalidos');
    expect(Array.isArray(body.details)).toBe(true);
  });
});
