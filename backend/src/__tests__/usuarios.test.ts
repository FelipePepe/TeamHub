import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Hono } from 'hono';
import {
  applyTestEnv,
  loginWithMfa,
  resetStore,
  resetDatabase,
  migrateTestDatabase,
  JSON_HEADERS,
} from '../test-utils';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'ValidPassword1!';
let app: Hono;

const loginAsAdmin = async () => {
  const { verifyBody } = await loginWithMfa(app, ADMIN_EMAIL, ADMIN_PASSWORD);
  return { token: verifyBody.accessToken as string, user: verifyBody.user };
};

const authHeaders = (token: string) => ({
  ...JSON_HEADERS,
  Authorization: `Bearer ${token}`,
});

beforeAll(async () => {
  applyTestEnv();
  await migrateTestDatabase();
  ({ default: app } = await import('../app'));
});

beforeEach(async () => {
  await resetDatabase();
  resetStore();
});

describe('usuarios routes', () => {
  it('requires auth to list users', async () => {
    const response = await app.request('/api/usuarios');

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
      headers: authHeaders(token),
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
      headers: authHeaders(token),
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
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    expect(createResponse.status).toBe(201);

    const duplicateResponse = await app.request('/api/usuarios', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    expect(duplicateResponse.status).toBe(400);
    const duplicateBody = await duplicateResponse.json();
    expect(duplicateBody).toMatchObject({ error: 'Email already exists' });
  });
});
