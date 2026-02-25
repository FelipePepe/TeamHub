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
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? 'ValidPassword1!';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'StrongPassword1!';
let app: Hono<HonoEnv>;

const loginAsAdmin = async () => {
  const { verifyBody, cookies } = await loginWithMfa(app, ADMIN_EMAIL, ADMIN_PASSWORD);
  return { cookies, user: verifyBody.user };
};

const authHeaders = (cookies: Record<string, string>, method: string, path: string) =>
  getSignedHeaders(method, path, {}, cookies);

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
    const { cookies } = await loginAsAdmin();

    const payload = {
      email: 'ana@example.com',
      password: TEST_USER_PASSWORD,
      nombre: 'Ana',
      rol: 'EMPLEADO',
    };

    const createResponse = await app.request('/api/usuarios', {
      method: 'POST',
      headers: authHeaders(cookies, 'POST', '/api/usuarios'),
      body: JSON.stringify(payload),
    });
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();
    expect(created).toMatchObject({
      email: payload.email,
      nombre: payload.nombre.toUpperCase(),
      rol: payload.rol,
      activo: true,
    });

    const listResponse = await app.request('/api/usuarios', {
      headers: authHeaders(cookies, 'GET', '/api/usuarios'),
    });
    expect(listResponse.status).toBe(200);
    const listBody = await listResponse.json();

    expect(listBody.meta.total).toBe(2);
    const emails = listBody.data.map((user: { email: string }) => user.email);
    expect(emails).toEqual(expect.arrayContaining([ADMIN_EMAIL, payload.email]));
  });

  it('rejects duplicate user emails', async () => {
    const { cookies } = await loginAsAdmin();

    const payload = {
      email: 'dup@example.com',
      password: TEST_USER_PASSWORD,
      nombre: 'Dup',
    };

    const createResponse = await app.request('/api/usuarios', {
      method: 'POST',
      headers: authHeaders(cookies, 'POST', '/api/usuarios'),
      body: JSON.stringify(payload),
    });
    expect(createResponse.status).toBe(201);

    const duplicateResponse = await app.request('/api/usuarios', {
      method: 'POST',
      headers: authHeaders(cookies, 'POST', '/api/usuarios'),
      body: JSON.stringify(payload),
    });
    expect(duplicateResponse.status).toBe(400);
    const duplicateBody = await duplicateResponse.json();
    expect(duplicateBody).toMatchObject({ error: 'El email ya existe' });
  });

  it('returns managerNombre and timestamps in user detail', async () => {
    const { cookies } = await loginAsAdmin();

    const createManagerResponse = await app.request('/api/usuarios', {
      method: 'POST',
      headers: authHeaders(cookies, 'POST', '/api/usuarios'),
      body: JSON.stringify({
        email: 'manager@example.com',
        password: TEST_USER_PASSWORD,
        nombre: 'Laura',
        apellidos: 'Gomez',
        rol: 'MANAGER',
      }),
    });
    expect(createManagerResponse.status).toBe(201);
    const createdManager = await createManagerResponse.json();

    const createEmpleadoResponse = await app.request('/api/usuarios', {
      method: 'POST',
      headers: authHeaders(cookies, 'POST', '/api/usuarios'),
      body: JSON.stringify({
        email: 'empleado@example.com',
        password: TEST_USER_PASSWORD,
        nombre: 'Mario',
        apellidos: 'Lopez',
        rol: 'EMPLEADO',
        managerId: createdManager.id,
      }),
    });
    expect(createEmpleadoResponse.status).toBe(201);
    const createdEmpleado = await createEmpleadoResponse.json();

    const detailPath = `/api/usuarios/${createdEmpleado.id}`;
    const detailResponse = await app.request(detailPath, {
      headers: authHeaders(cookies, 'GET', detailPath),
    });
    expect(detailResponse.status).toBe(200);
    const detail = await detailResponse.json();

    expect(detail.managerId).toBe(createdManager.id);
    expect(detail.managerNombre).toBe('LAURA GOMEZ');
    expect(detail.createdAt).toBeTruthy();
    expect(detail.updatedAt).toBeTruthy();
    expect(Number.isNaN(Date.parse(detail.createdAt))).toBe(false);
    expect(Number.isNaN(Date.parse(detail.updatedAt))).toBe(false);
  });
});
