import type { HonoEnv } from '../types/hono.js';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Hono } from 'hono';
import {
  applyTestEnv,
  loginWithMfa,
  resetStore,
  resetDatabase,
  migrateTestDatabase,
  getSignedHeaders,
} from '../test-utils/index.js';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'ValidPassword1!';
let app: Hono<HonoEnv>;

const loginAsAdmin = async () => {
  const { verifyBody } = await loginWithMfa(app, ADMIN_EMAIL, ADMIN_PASSWORD);
  return { token: verifyBody.accessToken as string, user: verifyBody.user };
};

const authHeaders = (token: string, method: string, path: string) =>
  getSignedHeaders(method, path, { Authorization: `Bearer ${token}` });

beforeAll(async () => {
  applyTestEnv();
  await migrateTestDatabase();
  ({ default: app } = await import('../app.js'));
});

beforeEach(async () => {
  await resetDatabase();
  resetStore();
});

describe('usuarios routes', () => {
  it('requires auth to list users', async () => {
    const response = await app.request('/api/usuarios', {
      headers: getSignedHeaders('GET', '/api/usuarios'),
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toMatchObject({ error: 'No autorizado' });
  });

  it('creates a user and lists results with meta', async () => {
    const { token } = await loginAsAdmin();

    const payload = {
      email: 'ana@example.com',
      password: 'StrongPassword1!',
      nombre: 'Ana',
      rol: 'EMPLEADO',
    };

    const createResponse = await app.request('/api/usuarios', {
      method: 'POST',
      headers: authHeaders(token, 'POST', '/api/usuarios'),
      body: JSON.stringify(payload),
    });
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();
    expect(created).toMatchObject({
      email: payload.email,
      nombre: payload.nombre,
      rol: payload.rol,
      activo: true,
    });

    const listResponse = await app.request('/api/usuarios', {
      headers: authHeaders(token, 'GET', '/api/usuarios'),
    });
    expect(listResponse.status).toBe(200);
    const listBody = await listResponse.json();

    expect(listBody.meta.total).toBe(2);
    const emails = listBody.data.map((user: { email: string }) => user.email);
    expect(emails).toEqual(expect.arrayContaining([ADMIN_EMAIL, payload.email]));
  });

  it('rejects duplicate user emails', async () => {
    const { token } = await loginAsAdmin();

    const payload = {
      email: 'dup@example.com',
      password: 'StrongPassword1!',
      nombre: 'Dup',
    };

    const createResponse = await app.request('/api/usuarios', {
      method: 'POST',
      headers: authHeaders(token, 'POST', '/api/usuarios'),
      body: JSON.stringify(payload),
    });
    expect(createResponse.status).toBe(201);

    const duplicateResponse = await app.request('/api/usuarios', {
      method: 'POST',
      headers: authHeaders(token, 'POST', '/api/usuarios'),
      body: JSON.stringify(payload),
    });
    expect(duplicateResponse.status).toBe(400);
    const duplicateBody = await duplicateResponse.json();
    expect(duplicateBody).toMatchObject({ error: 'El email ya existe' });
  });

  it('reset-password does not expose tempPassword in response', async () => {
    const { token } = await loginAsAdmin();

    // Create a test user first
    const createPayload = {
      email: 'reset@example.com',
      password: 'InitialPassword1!',
      nombre: 'Test User',
    };

    const createResponse = await app.request('/api/usuarios', {
      method: 'POST',
      headers: authHeaders(token, 'POST', '/api/usuarios'),
      body: JSON.stringify(createPayload),
    });
    expect(createResponse.status).toBe(201);
    const { id } = await createResponse.json();

    // Reset password for the created user
    const resetResponse = await app.request(`/api/usuarios/${id}/reset-password`, {
      method: 'PATCH',
      headers: authHeaders(token, 'PATCH', `/api/usuarios/${id}/reset-password`),
    });

    expect(resetResponse.status).toBe(200);
    const resetBody = await resetResponse.json();

    // 🔒 SECURITY TEST: Verify tempPassword is NOT in response
    expect(resetBody).not.toHaveProperty('tempPassword');
    expect(resetBody).toHaveProperty('message');
    expect(resetBody.message).toContain('Contraseña temporal generada');
  });
});
