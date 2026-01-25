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
const EMPLOYEE_EMAIL = 'empleado@example.com';
const EMPLOYEE_PASSWORD = 'ValidPassword1!';

let app: Hono;

const authHeaders = (token: string) => ({
  ...JSON_HEADERS,
  Authorization: `Bearer ${token}`,
});

const loginAsAdmin = async () => {
  const { verifyBody } = await loginWithMfa(app, ADMIN_EMAIL, ADMIN_PASSWORD);
  return { token: verifyBody.accessToken as string };
};

const loginAsEmployee = async () => {
  const { verifyBody } = await loginWithMfa(app, EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD);
  return { token: verifyBody.accessToken as string };
};

const createEmployee = async (token: string) => {
  const response = await app.request('/api/usuarios', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      email: EMPLOYEE_EMAIL,
      password: EMPLOYEE_PASSWORD,
      nombre: 'Empleado',
      rol: 'EMPLEADO',
    }),
  });
  expect(response.status).toBe(201);
  const body = await response.json();
  return body.id as string;
};

const createPlantillaWithTasks = async (token: string) => {
  const plantillaResponse = await app.request('/api/plantillas', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ nombre: 'Plantilla Base' }),
  });
  expect(plantillaResponse.status).toBe(201);
  const plantilla = await plantillaResponse.json();

  const tareaPayloads = [
    { titulo: 'Bienvenida', categoria: 'DOCUMENTACION', responsableTipo: 'RRHH', orden: 1 },
    { titulo: 'Accesos', categoria: 'ACCESOS', responsableTipo: 'IT', orden: 2 },
  ];

  for (const payload of tareaPayloads) {
    const tareaResponse = await app.request(`/api/plantillas/${plantilla.id}/tareas`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
    expect(tareaResponse.status).toBe(201);
  }

  return plantilla.id as string;
};

beforeAll(async () => {
  applyTestEnv();
  await migrateTestDatabase();
  ({ default: app } = await import('../app'));
});

beforeEach(async () => {
  await resetDatabase();
  resetStore();
});

describe('procesos routes', () => {
  it('creates proceso with tareas from plantilla', async () => {
    const { token } = await loginAsAdmin();
    const empleadoId = await createEmployee(token);
    const plantillaId = await createPlantillaWithTasks(token);

    const createResponse = await app.request('/api/procesos', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        empleadoId,
        plantillaId,
        fechaInicio: '2024-02-01',
      }),
    });
    expect(createResponse.status).toBe(201);
    const proceso = await createResponse.json();

    const detailResponse = await app.request(`/api/procesos/${proceso.id}`, {
      headers: authHeaders(token),
    });
    expect(detailResponse.status).toBe(200);
    const detail = await detailResponse.json();
    expect(detail.tareas).toHaveLength(2);
  });

  it('allows completing a tarea in proceso', async () => {
    const { token } = await loginAsAdmin();
    const empleadoId = await createEmployee(token);
    const plantillaId = await createPlantillaWithTasks(token);

    const createResponse = await app.request('/api/procesos', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        empleadoId,
        plantillaId,
        fechaInicio: '2024-02-01',
      }),
    });
    const proceso = await createResponse.json();

    const detailResponse = await app.request(`/api/procesos/${proceso.id}`, {
      headers: authHeaders(token),
    });
    const detail = await detailResponse.json();
    const tareaId = detail.tareas[0].id as string;

    const { token: empleadoToken } = await loginAsEmployee();
    const completeResponse = await app.request(
      `/api/procesos/${proceso.id}/tareas/${tareaId}/completar`,
      {
        method: 'PATCH',
        headers: authHeaders(empleadoToken),
        body: JSON.stringify({ notas: 'Completada' }),
      }
    );
    expect(completeResponse.status).toBe(200);
    const completed = await completeResponse.json();
    expect(completed.estado).toBe('COMPLETADA');
  });
});
