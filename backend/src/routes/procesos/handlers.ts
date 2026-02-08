import type { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { and, eq, isNull } from 'drizzle-orm';
import type { HonoEnv } from '../../types/hono.js';
import { authMiddleware, requireRoles } from '../../middleware/auth.js';
import { parseJson, parseParams, parseQuery } from '../../validators/parse.js';
import { db } from '../../db/index.js';
import { procesosOnboarding, tareasOnboarding } from '../../db/schema/procesos.js';
import { tareasPlantilla } from '../../db/schema/plantillas.js';
import { users } from '../../db/schema/users.js';
import type { User } from '../../db/schema/users.js';
import { toProcesoResponse, toTareaOnboardingResponse } from '../../services/mappers.js';
import {
  findProcesoById,
  findTareaOnboardingById,
  listProcesos,
  listTareasByProcesoId,
  updateProcesoById,
  updateTareaOnboardingById,
} from '../../services/procesos-repository.js';
import { findPlantillaById } from '../../services/plantillas-repository.js';
import {
  cancelProcesoSchema,
  completarTareaSchema,
  createProcesoSchema,
  empleadoParamsSchema,
  idParamsSchema,
  listQuerySchema,
  tareaParamsSchema,
  updateProcesoSchema,
  updateTareaSchema,
} from './schemas.js';

export const registerProcesosRoutes = (router: Hono<HonoEnv>) => {
  router.use('*', authMiddleware);

  router.get('/', async (c) => {
    const query = parseQuery(c, listQuerySchema);
    const filters = {
      estado: query.estado,
      empleadoId: query.empleadoId,
    };

    let procesos = [];
    if (query.departamentoId) {
      const clauses = [eq(users.departamentoId, query.departamentoId), isNull(procesosOnboarding.deletedAt)];
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

  router.post('/', requireRoles('ADMIN', 'RRHH'), async (c) => {
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
            estado: 'PENDIENTE' as const,
            prioridad: 'MEDIA' as const,
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

  router.get('/mis-tareas', async (c) => {
    const user = c.get('user') as User;
    const tareas = await db
      .select()
      .from(tareasOnboarding)
      .where(eq(tareasOnboarding.responsableId, user.id));

    return c.json({ data: tareas.map(toTareaOnboardingResponse) });
  });

  router.get('/estadisticas', async (c) => {
    const procesos = await db
      .select({ estado: procesosOnboarding.estado })
      .from(procesosOnboarding)
      .where(isNull(procesosOnboarding.deletedAt));
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

  router.get('/empleado/:empleadoId', async (c) => {
    const { empleadoId } = parseParams(c, empleadoParamsSchema);
    const procesos = await listProcesos({ empleadoId });
    return c.json({ data: procesos.map(toProcesoResponse) });
  });

  router.get('/:id', async (c) => {
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

  router.put('/:id', requireRoles('ADMIN', 'RRHH'), async (c) => {
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

  router.patch('/:id/cancelar', requireRoles('ADMIN', 'RRHH'), async (c) => {
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

  router.patch('/:id/pausar', requireRoles('ADMIN', 'RRHH'), async (c) => {
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

  router.patch('/:id/reanudar', requireRoles('ADMIN', 'RRHH'), async (c) => {
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

  router.get('/:id/tareas', async (c) => {
    const { id } = parseParams(c, idParamsSchema);
    const tareas = await listTareasByProcesoId(id);
    return c.json({ data: tareas.map(toTareaOnboardingResponse) });
  });

  router.patch('/:id/tareas/:tareaId', async (c) => {
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

  router.patch('/:id/tareas/:tareaId/completar', async (c) => {
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
};
