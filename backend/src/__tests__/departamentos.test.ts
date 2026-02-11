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

const authHeaders = (cookies: Record<string, string>, method: string, path: string) =>
  getSignedHeaders(method, path, {}, cookies);

const loginAsAdmin = async () => {
  const { verifyBody, cookies } = await loginWithMfa(app, ADMIN_EMAIL, ADMIN_PASSWORD);
  return { cookies };
};

beforeAll(async () => {
  applyTestEnv();
  await migrateTestDatabase();
  ({ default: app } = await import('../app.js'));
});

beforeEach(async () => {
  await resetDatabase();
  resetStore();
});

describe('departamentos routes', () => {
  it('requires auth to list departamentos', async () => {
    const response = await app.request('/api/departamentos', {
      headers: getSignedHeaders('GET', '/api/departamentos'),
    });

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toMatchObject({ error: 'No autorizado' });
  });

  it('creates a departamento and lists it', async () => {
    const { cookies } = await loginAsAdmin();
    const payload = {
      nombre: 'Ingenieria',
      codigo: 'ENG',
      descripcion: 'Equipo de desarrollo',
    };

    const createResponse = await app.request('/api/departamentos', {
      method: 'POST',
      headers: authHeaders(cookies, 'POST', '/api/departamentos'),
      body: JSON.stringify(payload),
    });
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();
    expect(created).toMatchObject({
      nombre: payload.nombre,
      codigo: payload.codigo,
      descripcion: payload.descripcion,
      activo: true,
    });

    const listResponse = await app.request('/api/departamentos', {
      headers: authHeaders(cookies, 'GET', '/api/departamentos'),
    });
    expect(listResponse.status).toBe(200);
    const listBody = await listResponse.json();
    expect(listBody.data).toHaveLength(1);
    expect(listBody.data[0]).toMatchObject({ nombre: payload.nombre, codigo: payload.codigo });
  });

  it('rejects duplicate nombre or codigo', async () => {
    const { cookies } = await loginAsAdmin();
    const payload = {
      nombre: 'Finanzas',
      codigo: 'FIN',
    };

    const createResponse = await app.request('/api/departamentos', {
      method: 'POST',
      headers: authHeaders(cookies, 'POST', '/api/departamentos'),
      body: JSON.stringify(payload),
    });
    expect(createResponse.status).toBe(201);

    const duplicateResponse = await app.request('/api/departamentos', {
      method: 'POST',
      headers: authHeaders(cookies, 'POST', '/api/departamentos'),
      body: JSON.stringify(payload),
    });
    expect(duplicateResponse.status).toBe(400);
  });

  it('supports soft delete with activo filter', async () => {
    const { cookies } = await loginAsAdmin();
    const payload = {
      nombre: 'Marketing',
      codigo: 'MKT',
    };

    const createResponse = await app.request('/api/departamentos', {
      method: 'POST',
      headers: authHeaders(cookies, 'POST', '/api/departamentos'),
      body: JSON.stringify(payload),
    });
    const created = await createResponse.json();

    const deleteResponse = await app.request(`/api/departamentos/${created.id}`, {
      method: 'DELETE',
      headers: authHeaders(cookies, 'DELETE', `/api/departamentos/${created.id}`),
    });
    expect(deleteResponse.status).toBe(200);

    const inactiveResponse = await app.request('/api/departamentos?activo=false', {
      headers: authHeaders(cookies, 'GET', '/api/departamentos'),
    });
    expect(inactiveResponse.status).toBe(200);
    const inactiveBody = await inactiveResponse.json();
    expect(inactiveBody.data).toHaveLength(1);

    const activeResponse = await app.request('/api/departamentos?activo=true', {
      headers: authHeaders(cookies, 'GET', '/api/departamentos'),
    });
    expect(activeResponse.status).toBe(200);
    const activeBody = await activeResponse.json();
    expect(activeBody.data).toHaveLength(0);
  });
});
