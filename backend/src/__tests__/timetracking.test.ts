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
const PROJECT_NAME = 'Proyecto Alpha';
const PROJECT_CODE = 'ALPHA';

const HOURS_BILLABLE = 5;
const HOURS_NON_BILLABLE = 3;
const DATE_ONE = '2024-01-10';
const DATE_TWO = '2024-01-11';

let app: Hono<HonoEnv>;

const authHeaders = (token: string) => ({
  ...JSON_HEADERS,
  Authorization: `Bearer ${token}`,
});

const loginAsAdmin = async () => {
  const { verifyBody } = await loginWithMfa(app, ADMIN_EMAIL, ADMIN_PASSWORD);
  return { token: verifyBody.accessToken as string, user: verifyBody.user as { id: string } };
};

const createProject = async (token: string) => {
  const response = await app.request('/api/proyectos', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      nombre: PROJECT_NAME,
      codigo: PROJECT_CODE,
    }),
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

describe('timetracking resumen', () => {
  it('summarizes hours by project, day, and status', async () => {
    const { token } = await loginAsAdmin();
    const project = await createProject(token);
    const projectId = project.id as string;

    const createRegistro = async (payload: Record<string, unknown>) => {
      const response = await app.request('/api/timetracking', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });
      expect(response.status).toBe(201);
      return response.json();
    };

    const registroA = await createRegistro({
      proyectoId: projectId,
      fecha: DATE_ONE,
      horas: HOURS_BILLABLE,
      descripcion: 'Trabajo facturable',
      facturable: true,
    });
    await createRegistro({
      proyectoId: projectId,
      fecha: DATE_TWO,
      horas: HOURS_NON_BILLABLE,
      descripcion: 'Trabajo interno',
      facturable: false,
    });

    const approveResponse = await app.request(`/api/timetracking/${registroA.id}/aprobar`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({}),
    });
    expect(approveResponse.status).toBe(200);

    const resumenResponse = await app.request('/api/timetracking/resumen', {
      headers: authHeaders(token),
    });
    expect(resumenResponse.status).toBe(200);
    const resumen = await resumenResponse.json();

    expect(resumen.totalHoras).toBe(HOURS_BILLABLE + HOURS_NON_BILLABLE);
    expect(resumen.horasFacturables).toBe(HOURS_BILLABLE);
    expect(resumen.horasNoFacturables).toBe(HOURS_NON_BILLABLE);

    const porDia = Object.fromEntries(
      resumen.porDia.map((item: { fecha: string; horas: number }) => [
        item.fecha,
        item.horas,
      ])
    );
    expect(porDia).toMatchObject({
      [DATE_ONE]: HOURS_BILLABLE,
      [DATE_TWO]: HOURS_NON_BILLABLE,
    });

    const porEstado = Object.fromEntries(
      resumen.porEstado.map((item: { estado: string; horas: number }) => [
        item.estado,
        item.horas,
      ])
    );
    expect(porEstado).toMatchObject({
      APROBADO: HOURS_BILLABLE,
      PENDIENTE: HOURS_NON_BILLABLE,
    });

    expect(resumen.porProyecto).toHaveLength(1);
    expect(resumen.porProyecto[0]).toMatchObject({
      proyectoId: projectId,
      nombre: PROJECT_NAME,
      horas: HOURS_BILLABLE + HOURS_NON_BILLABLE,
    });
  });
});
