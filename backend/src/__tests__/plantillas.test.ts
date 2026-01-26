import type { HonoEnv } from '../types/hono.js';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Hono } from 'hono';
import {
  applyTestEnv,
  loginWithMfa,
  resetStore,
  resetDatabase,
  migrateTestDatabase,
  JSON_HEADERS,
} from '../test-utils/index.js';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'ValidPassword1!';

let app: Hono<HonoEnv>;

const authHeaders = (token: string) => ({
  ...JSON_HEADERS,
  Authorization: `Bearer ${token}`,
});

const loginAsAdmin = async () => {
  const { verifyBody } = await loginWithMfa(app, ADMIN_EMAIL, ADMIN_PASSWORD);
  return { token: verifyBody.accessToken as string };
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

describe('plantillas routes', () => {
  it('requires auth to list plantillas', async () => {
    const response = await app.request('/api/plantillas');

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toMatchObject({ error: 'No autorizado' });
  });

  it('creates plantilla with tareas and returns detail', async () => {
    const { token } = await loginAsAdmin();
    const plantillaPayload = {
      nombre: 'Onboarding Dev',
      descripcion: 'Plantilla base',
    };

    const createResponse = await app.request('/api/plantillas', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(plantillaPayload),
    });
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();
    expect(created).toMatchObject({ nombre: plantillaPayload.nombre, activo: true });

    const tareaPayload = {
      titulo: 'Configurar acceso',
      categoria: 'ACCESOS',
      responsableTipo: 'IT',
      orden: 1,
    };

    const tareaResponse = await app.request(`/api/plantillas/${created.id}/tareas`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(tareaPayload),
    });
    expect(tareaResponse.status).toBe(201);

    const detailResponse = await app.request(`/api/plantillas/${created.id}`, {
      headers: authHeaders(token),
    });
    expect(detailResponse.status).toBe(200);
    const detail = await detailResponse.json();
    expect(detail.tareas).toHaveLength(1);
    expect(detail.tareas[0]).toMatchObject({ titulo: tareaPayload.titulo });
  });

  it('duplicates plantilla with tareas', async () => {
    const { token } = await loginAsAdmin();
    const plantillaPayload = {
      nombre: 'Onboarding QA',
      descripcion: 'QA base',
    };

    const createResponse = await app.request('/api/plantillas', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(plantillaPayload),
    });
    const created = await createResponse.json();

    await app.request(`/api/plantillas/${created.id}/tareas`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        titulo: 'Alta en herramientas',
        categoria: 'ACCESOS',
        responsableTipo: 'IT',
        orden: 1,
      }),
    });

    const duplicateResponse = await app.request(`/api/plantillas/${created.id}/duplicar`, {
      method: 'POST',
      headers: authHeaders(token),
    });
    expect(duplicateResponse.status).toBe(201);
    const duplicated = await duplicateResponse.json();
    expect(duplicated.nombre).toContain('(copy)');

    const detailResponse = await app.request(`/api/plantillas/${duplicated.id}`, {
      headers: authHeaders(token),
    });
    const detail = await detailResponse.json();
    expect(detail.tareas).toHaveLength(1);
  });
});
