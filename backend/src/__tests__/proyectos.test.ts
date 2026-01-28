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
  return {
    token: verifyBody.accessToken as string,
    user: verifyBody.user as { id: string },
  };
};

const createProject = async (token: string, overrides?: Record<string, unknown>) => {
  const payload = {
    nombre: 'Proyecto Alpha',
    codigo: 'ALPHA',
    ...overrides,
  };
  const response = await app.request('/api/proyectos', {
    method: 'POST',
    headers: authHeaders(token),
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
    const { token, user } = await loginAsAdmin();
    const created = await createProject(token);

    expect(created).toMatchObject({
      nombre: 'Proyecto Alpha',
      codigo: 'ALPHA',
      managerId: user.id,
      activo: true,
      estado: 'PLANIFICACION',
    });

    const listResponse = await app.request('/api/proyectos', {
      headers: authHeaders(token),
    });
    expect(listResponse.status).toBe(200);
    const listBody = await listResponse.json();
    expect(listBody.data).toHaveLength(1);
    expect(listBody.data[0]).toMatchObject({ id: created.id, codigo: 'ALPHA' });
  });

  it('creates an assignment and finalizes it', async () => {
    const { token, user } = await loginAsAdmin();
    const project = await createProject(token, { codigo: 'BETA', nombre: 'Proyecto Beta' });

    const assignResponse = await app.request(`/api/proyectos/${project.id}/asignaciones`, {
      method: 'POST',
      headers: authHeaders(token),
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
      headers: authHeaders(token),
    });
    expect(myProjectsResponse.status).toBe(200);
    const myProjects = await myProjectsResponse.json();
    expect(myProjects.data).toHaveLength(1);
    expect(myProjects.data[0]).toMatchObject({ id: project.id });

    const finalizeResponse = await app.request(
      `/api/proyectos/${project.id}/asignaciones/${asignacion.id}/finalizar`,
      {
        method: 'PATCH',
        headers: authHeaders(token),
      }
    );
    expect(finalizeResponse.status).toBe(200);
    const finalized = await finalizeResponse.json();
    expect(finalized.activo).toBe(false);
    expect(finalized.fechaFin).toBe(new Date().toISOString().slice(0, 10));
  });
});
