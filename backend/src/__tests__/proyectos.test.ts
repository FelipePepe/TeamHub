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
  return {
    cookies,
    user: verifyBody.user as { id: string },
  };
};

const createProject = async (cookies: Record<string, string>, overrides?: Record<string, unknown>) => {
  const payload = {
    nombre: 'Proyecto Alpha',
    codigo: 'ALPHA',
    ...overrides,
  };
  const response = await app.request('/api/proyectos', {
    method: 'POST',
    headers: authHeaders(cookies, 'POST', '/api/proyectos'),
    body: JSON.stringify(payload),
  });
  expect(response.status).toBe(201);
  return response.json();
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

describe('proyectos routes', () => {
  it('creates a project and lists it', async () => {
    const { cookies, user } = await loginAsAdmin();
    const created = await createProject(cookies);

    expect(created).toMatchObject({
      nombre: 'Proyecto Alpha',
      codigo: 'ALPHA',
      managerId: user.id,
      activo: true,
      estado: 'PLANIFICACION',
    });

    const listResponse = await app.request('/api/proyectos', {
      headers: authHeaders(cookies, 'GET', '/api/proyectos'),
    });
    expect(listResponse.status).toBe(200);
    const listBody = await listResponse.json();
    expect(listBody.data).toHaveLength(1);
    expect(listBody.data[0]).toMatchObject({ id: created.id, codigo: 'ALPHA' });
  });

  it('creates an assignment and finalizes it', async () => {
    const { cookies, user } = await loginAsAdmin();
    const project = await createProject(cookies, { codigo: 'BETA', nombre: 'Proyecto Beta' });

    const assignPath = `/api/proyectos/${project.id}/asignaciones`;
    const assignResponse = await app.request(assignPath, {
      method: 'POST',
      headers: authHeaders(cookies, 'POST', assignPath),
      body: JSON.stringify({
        usuarioId: user.id,
        fechaInicio: '2024-01-01',
        dedicacionPorcentaje: 50,
      }),
    });
    expect(assignResponse.status).toBe(201);
    const asignacion = await assignResponse.json();
    expect(asignacion).toMatchObject({
      proyectoId: project.id,
      usuarioId: user.id,
      activo: true,
    });

    const myProjectsResponse = await app.request('/api/proyectos/mis-proyectos', {
      headers: authHeaders(cookies, 'GET', '/api/proyectos/mis-proyectos'),
    });
    expect(myProjectsResponse.status).toBe(200);
    const myProjects = await myProjectsResponse.json();
    expect(myProjects.data).toHaveLength(1);
    expect(myProjects.data[0]).toMatchObject({ id: project.id });

    const finalizePath = `/api/proyectos/${project.id}/asignaciones/${asignacion.id}/finalizar`;
    const finalizeResponse = await app.request(finalizePath, {
      method: 'PATCH',
      headers: authHeaders(cookies, 'PATCH', finalizePath),
    });
    expect(finalizeResponse.status).toBe(200);
    const finalized = await finalizeResponse.json();
    expect(finalized.activo).toBe(false);
    expect(finalized.fechaFin).toBe(new Date().toISOString().slice(0, 10));
  });
});
