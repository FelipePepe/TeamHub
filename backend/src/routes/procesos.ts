import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { parseJson, parseParams, parseQuery } from '../validators/parse';
import { dateSchema, uuidSchema } from '../validators/common';
import { db } from '../db';
import { procesosOnboarding, tareasOnboarding } from '../db/schema/procesos';
import { tareasPlantilla } from '../db/schema/plantillas';
import { users } from '../db/schema/users';
import type { User } from '../db/schema/users';
import { toProcesoResponse, toTareaOnboardingResponse } from '../services/mappers';
import {
  findProcesoById,
  findTareaOnboardingById,
  listProcesos,
  listTareasByProcesoId,
  updateProcesoById,
  updateTareaOnboardingById,
} from '../services/procesos-repository';
import { findPlantillaById } from '../services/plantillas-repository';
import { and, eq } from 'drizzle-orm';

const estados = ['EN_CURSO', 'COMPLETADO', 'CANCELADO', 'PAUSADO'] as const;
const tareasEstado = ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA', 'BLOQUEADA', 'CANCELADA'] as const;
const prioridades = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'] as const;

const listQuerySchema = z.object({
  estado: z.enum(estados).optional(),
  empleadoId: uuidSchema.optional(),
  departamentoId: uuidSchema.optional(),
});

const createProcesoSchema = z.object({
  empleadoId: uuidSchema,
  plantillaId: uuidSchema,
  fechaInicio: dateSchema,
});

const updateProcesoSchema = z.object({
  fechaInicio: dateSchema.optional(),
  fechaFinEsperada: dateSchema.optional(),
  notas: z.string().optional(),
  estado: z.enum(estados).optional(),
});

const cancelProcesoSchema = z.object({
  motivo: z.string().optional(),
});

const updateTareaSchema = z.object({
  estado: z.enum(tareasEstado).optional(),
  prioridad: z.enum(prioridades).optional(),
  notas: z.string().optional(),
});

const completarTareaSchema = z.object({
  evidenciaUrl: z.string().optional(),
  notas: z.string().optional(),
});

const idParamsSchema = z.object({
  id: uuidSchema,
});

const tareaParamsSchema = z.object({
  id: uuidSchema,
  tareaId: uuidSchema,
});

export const procesosRoutes = new Hono();

procesosRoutes.use('*', authMiddleware);

procesosRoutes.get('/', async (c) => {
  const query = parseQuery(c, listQuerySchema);
  const filters = {
    estado: query.estado,
    empleadoId: query.empleadoId,
  };

  let procesos = [];
  if (query.departamentoId) {
    const clauses = [eq(users.departamentoId, query.departamentoId)];
    if (filters.estado) {
      clauses.push(eq(procesosOnboarding.estado, filters.estado));
    }
    if (filters.empleadoId) {
      clauses.push(eq(procesosOnboarding.empleadoId, filters.empleadoId));
    }
    const rows = await db
      .select({ proceso: procesosOnboarding })
      .from(procesosOnboarding)
      .innerJoin(users, eq(procesosOnboarding.empleadoId, users.id))
      .where(and(...clauses));
    procesos = rows.map((row) => row.proceso);
  } else {
    procesos = await listProcesos(filters);
  }

  return c.json({ data: procesos.map(toProcesoResponse) });
});

procesosRoutes.post('/', async (c) => {
  const payload = await parseJson(c, createProcesoSchema);
  const plantilla = await findPlantillaById(payload.plantillaId);
  if (!plantilla) {
    throw new HTTPException(404, { message: 'Plantilla no encontrada' });
  }
  const user = c.get('user') as User;

  const proceso = await db.transaction(async (tx) => {
    const now = new Date();
    const [nuevoProceso] = await tx
      .insert(procesosOnboarding)
      .values({
        empleadoId: payload.empleadoId,
        plantillaId: payload.plantillaId,
        fechaInicio: payload.fechaInicio,
        estado: 'EN_CURSO',
        progreso: '0',
        iniciadoPor: user.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const tareas = await tx
      .select()
      .from(tareasPlantilla)
      .where(eq(tareasPlantilla.plantillaId, payload.plantillaId));

    if (tareas.length) {
      await tx.insert(tareasOnboarding).values(
        tareas.map((tareaPlantilla, index) => ({
          procesoId: nuevoProceso.id,
          tareaPlantillaId: tareaPlantilla.id,
          titulo: tareaPlantilla.titulo,
          descripcion: tareaPlantilla.descripcion,
          categoria: tareaPlantilla.categoria,
          responsableId: payload.empleadoId,
          estado: 'PENDIENTE',
          prioridad: 'MEDIA',
          orden: tareaPlantilla.orden ?? index + 1,
          createdAt: now,
          updatedAt: now,
        }))
      );
    }

    return nuevoProceso;
  });

  return c.json(toProcesoResponse(proceso), 201);
});

procesosRoutes.get('/mis-tareas', async (c) => {
  const user = c.get('user') as User;
  const tareas = await db
    .select()
    .from(tareasOnboarding)
    .where(eq(tareasOnboarding.responsableId, user.id));

  return c.json({ data: tareas.map(toTareaOnboardingResponse) });
});

procesosRoutes.get('/estadisticas', async (c) => {
  const procesos = await db
    .select({ estado: procesosOnboarding.estado })
    .from(procesosOnboarding);
  const stats = procesos.reduce(
    (acc, proceso) => {
      acc.total += 1;
      acc[proceso.estado] += 1;
      return acc;
    },
    {
      total: 0,
      EN_CURSO: 0,
      COMPLETADO: 0,
      CANCELADO: 0,
      PAUSADO: 0,
    }
  );

  return c.json({
    total: stats.total,
    enCurso: stats.EN_CURSO,
    completados: stats.COMPLETADO,
    cancelados: stats.CANCELADO,
    pausados: stats.PAUSADO,
  });
});

procesosRoutes.get('/empleado/:empleadoId', async (c) => {
  const { empleadoId } = parseParams(c, z.object({ empleadoId: uuidSchema }));
  const procesos = await listProcesos({ empleadoId });
  return c.json({ data: procesos.map(toProcesoResponse) });
});

procesosRoutes.get('/:id', async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const proceso = await findProcesoById(id);
  if (!proceso) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }

  const tareas = await listTareasByProcesoId(id);

  return c.json({
    ...toProcesoResponse(proceso),
    tareas: tareas.map(toTareaOnboardingResponse),
  });
});

procesosRoutes.put('/:id', async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const payload = await parseJson(c, updateProcesoSchema);
  const proceso = await findProcesoById(id);
  if (!proceso) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }
  const updated = await updateProcesoById(id, {
    ...payload,
    updatedAt: new Date(),
  });
  if (!updated) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }

  return c.json(toProcesoResponse(updated));
});

procesosRoutes.patch('/:id/cancelar', async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  await parseJson(c, cancelProcesoSchema);
  const proceso = await findProcesoById(id);
  if (!proceso) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }
  const updated = await updateProcesoById(id, {
    estado: 'CANCELADO',
    updatedAt: new Date(),
  });
  if (!updated) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }
  return c.json(toProcesoResponse(updated));
});

procesosRoutes.patch('/:id/pausar', async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const proceso = await findProcesoById(id);
  if (!proceso) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }
  const updated = await updateProcesoById(id, {
    estado: 'PAUSADO',
    updatedAt: new Date(),
  });
  if (!updated) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }
  return c.json(toProcesoResponse(updated));
});

procesosRoutes.patch('/:id/reanudar', async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const proceso = await findProcesoById(id);
  if (!proceso) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }
  const updated = await updateProcesoById(id, {
    estado: 'EN_CURSO',
    updatedAt: new Date(),
  });
  if (!updated) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }
  return c.json(toProcesoResponse(updated));
});

procesosRoutes.get('/:id/tareas', async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const tareas = await listTareasByProcesoId(id);
  return c.json({ data: tareas.map(toTareaOnboardingResponse) });
});

procesosRoutes.patch('/:id/tareas/:tareaId', async (c) => {
  const { id, tareaId } = parseParams(c, tareaParamsSchema);
  const payload = await parseJson(c, updateTareaSchema);
  const tarea = await findTareaOnboardingById(tareaId);
  if (!tarea) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }
  if (tarea.procesoId !== id) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }

  const updated = await updateTareaOnboardingById(tareaId, {
    ...payload,
    updatedAt: new Date(),
  });
  if (!updated) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }

  return c.json(toTareaOnboardingResponse(updated));
});

procesosRoutes.patch('/:id/tareas/:tareaId/completar', async (c) => {
  const user = c.get('user') as User;
  const { id, tareaId } = parseParams(c, tareaParamsSchema);
  const payload = await parseJson(c, completarTareaSchema);
  const tarea = await findTareaOnboardingById(tareaId);
  if (!tarea) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }
  if (tarea.procesoId !== id) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }

  const updated = await updateTareaOnboardingById(tareaId, {
    estado: 'COMPLETADA',
    evidenciaUrl: payload.evidenciaUrl,
    notas: payload.notas,
    completadaAt: new Date(),
    completadaPor: user.id,
    updatedAt: new Date(),
  });
  if (!updated) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }

  return c.json(toTareaOnboardingResponse(updated));
});
