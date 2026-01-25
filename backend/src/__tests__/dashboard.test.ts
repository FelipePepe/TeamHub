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
import { plantillasOnboarding } from '../db/schema/plantillas';
import { procesosOnboarding, tareasOnboarding } from '../db/schema/procesos';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'ValidPassword1!';
const USER_PASSWORD = 'ValidPassword1!';

let app: Hono;
let db: typeof import('../db').db;

const authHeaders = (token: string) => ({
  ...JSON_HEADERS,
  Authorization: `Bearer ${token}`,
});

const toDateString = (date: Date) => date.toISOString().slice(0, 10);

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const loginAs = async (email: string, password: string) => {
  const { verifyBody } = await loginWithMfa(app, email, password);
  return {
    token: verifyBody.accessToken as string,
    user: verifyBody.user as { id: string },
  };
};

const createUser = async (token: string, payload: Record<string, unknown>) => {
  const response = await app.request('/api/usuarios', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  expect(response.status).toBe(201);
  return response.json();
};

const createProject = async (token: string, payload: Record<string, unknown>) => {
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
  ({ db } = await import('../db'));
  await migrateTestDatabase();
  ({ default: app } = await import('../app'));
});

beforeEach(async () => {
  await resetDatabase();
  resetStore();
});

describe('dashboard metrics', () => {
  it('returns computed metrics for admin, rrhh, manager, and empleado', async () => {
    const now = new Date();
    const today = toDateString(now);
    const yesterday = toDateString(addDays(now, -1));

    const admin = await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);

    const manager = await createUser(admin.token, {
      email: 'manager@example.com',
      password: USER_PASSWORD,
      nombre: 'Manager',
      apellidos: 'Uno',
      rol: 'MANAGER',
    });

    const employee = await createUser(admin.token, {
      email: 'empleado@example.com',
      password: USER_PASSWORD,
      nombre: 'Empleado',
      apellidos: 'Dos',
      rol: 'EMPLEADO',
      managerId: manager.id,
    });

    const managerSession = await loginAs('manager@example.com', USER_PASSWORD);
    const employeeSession = await loginAs('empleado@example.com', USER_PASSWORD);

    const project = await createProject(managerSession.token, {
      nombre: 'Proyecto Equipo',
      codigo: 'TEAM',
    });

    const estadoResponse = await app.request(`/api/proyectos/${project.id}/estado`, {
      method: 'PATCH',
      headers: authHeaders(managerSession.token),
      body: JSON.stringify({ estado: 'ACTIVO' }),
    });
    expect(estadoResponse.status).toBe(200);

    const assignResponse = await app.request(`/api/proyectos/${project.id}/asignaciones`, {
      method: 'POST',
      headers: authHeaders(managerSession.token),
      body: JSON.stringify({
        usuarioId: employee.id,
        fechaInicio: today,
        dedicacionPorcentaje: 50,
      }),
    });
    expect(assignResponse.status).toBe(201);

    const timeResponse = await app.request('/api/timetracking', {
      method: 'POST',
      headers: authHeaders(managerSession.token),
      body: JSON.stringify({
        proyectoId: project.id,
        usuarioId: employee.id,
        fecha: today,
        horas: 4,
        descripcion: 'Trabajo pendiente',
      }),
    });
    expect(timeResponse.status).toBe(201);

    const plantilla = await db
      .insert(plantillasOnboarding)
      .values({
        nombre: 'Plantilla Base',
        createdBy: admin.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const proceso = await db
      .insert(procesosOnboarding)
      .values({
        empleadoId: employee.id,
        plantillaId: plantilla[0].id,
        fechaInicio: today,
        estado: 'EN_CURSO',
        progreso: '25',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await db.insert(tareasOnboarding).values({
      procesoId: proceso[0].id,
      titulo: 'Preparar equipo',
      categoria: 'EQUIPAMIENTO',
      responsableId: employee.id,
      fechaLimite: yesterday,
      estado: 'PENDIENTE',
      prioridad: 'MEDIA',
      orden: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const adminResponse = await app.request('/api/dashboard/admin', {
      headers: authHeaders(admin.token),
    });
    expect(adminResponse.status).toBe(200);
    const adminBody = await adminResponse.json();
    expect(adminBody.kpis.usuariosActivos).toBeGreaterThanOrEqual(3);
    expect(adminBody.kpis.proyectosActivos).toBe(1);
    expect(adminBody.kpis.horasMes).toBe(4);
    expect(adminBody.kpis.onboardingsEnCurso).toBe(1);
    expect(adminBody.kpis.tareasVencidas).toBe(1);

    const rrhhResponse = await app.request('/api/dashboard/rrhh', {
      headers: authHeaders(admin.token),
    });
    expect(rrhhResponse.status).toBe(200);
    const rrhhBody = await rrhhResponse.json();
    expect(rrhhBody.kpis.onboardingsEnCurso).toBe(1);
    expect(rrhhBody.kpis.tareasVencidas).toBe(1);

    const managerResponse = await app.request('/api/dashboard/manager', {
      headers: authHeaders(managerSession.token),
    });
    expect(managerResponse.status).toBe(200);
    const managerBody = await managerResponse.json();
    expect(managerBody.kpis.miembrosEquipo).toBe(1);
    expect(managerBody.kpis.proyectosActivos).toBe(1);
    expect(managerBody.kpis.horasPendientesAprobar).toBe(4);

    const empleadoResponse = await app.request('/api/dashboard/empleado', {
      headers: authHeaders(employeeSession.token),
    });
    expect(empleadoResponse.status).toBe(200);
    const empleadoBody = await empleadoResponse.json();
    expect(empleadoBody.kpis.horasMes).toBe(4);
    expect(empleadoBody.kpis.proyectosActivos).toBe(1);
    expect(empleadoBody.kpis.ocupacion).toBe(50);
    expect(empleadoBody.kpis.tareasPendientes).toBe(1);
  });
});
