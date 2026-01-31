import type { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { and, eq, inArray } from 'drizzle-orm';
import type { HonoEnv } from '../../types/hono.js';
import { authMiddleware } from '../../middleware/auth.js';
import { parseJson, parseParams, parseQuery } from '../../validators/parse.js';
import { db } from '../../db/index.js';
import { plantillasOnboarding, tareasPlantilla } from '../../db/schema/plantillas.js';
import type { PlantillaOnboarding } from '../../db/schema/plantillas.js';
import type { User } from '../../db/schema/users.js';
import { toPlantillaResponse, toTareaPlantillaResponse } from '../../services/mappers.js';
import {
  createPlantilla,
  createTareaPlantilla,
  deleteTareaPlantillaById,
  findPlantillaById,
  findTareaById,
  listPlantillas,
  listTareasByPlantillaId,
  updatePlantillaById,
  updateTareaPlantillaById,
} from '../../services/plantillas-repository.js';
import {
  createPlantillaSchema,
  createTareaSchema,
  listQuerySchema,
  plantillaIdSchema,
  reorderSchema,
  tareaIdSchema,
  updatePlantillaSchema,
  updateTareaSchema,
} from './schemas.js';

export const registerPlantillasRoutes = (router: Hono<HonoEnv>) => {
  router.use('*', authMiddleware);

  router.get('/', async (c) => {
    const query = parseQuery(c, listQuerySchema);
    const activo = query.activo;
    const plantillas = await listPlantillas({
      departamentoId: query.departamentoId,
      activo,
    });

    return c.json({ data: plantillas.map(toPlantillaResponse) });
  });

  router.post('/', async (c) => {
    const payload = await parseJson(c, createPlantillaSchema);
    const user = c.get('user') as User;
    const now = new Date();
    const plantilla = await createPlantilla({
      nombre: payload.nombre,
      descripcion: payload.descripcion,
      departamentoId: payload.departamentoId,
      rolDestino: payload.rolDestino,
      duracionEstimadaDias: payload.duracionEstimadaDias,
      createdBy: user.id,
      deletedAt: payload.activo === false ? now : null,
      createdAt: now,
      updatedAt: now,
    });
    if (!plantilla) {
      throw new HTTPException(500, { message: 'Error al crear plantilla' });
    }

    return c.json(toPlantillaResponse(plantilla), 201);
  });

  router.get('/:id', async (c) => {
    const { id } = parseParams(c, plantillaIdSchema);
    const plantilla = await findPlantillaById(id);
    if (!plantilla) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    const tareas = await listTareasByPlantillaId(id);

    return c.json({
      ...toPlantillaResponse(plantilla),
      tareas: tareas.map(toTareaPlantillaResponse),
    });
  });

  router.put('/:id', async (c) => {
    const { id } = parseParams(c, plantillaIdSchema);
    const payload = await parseJson(c, updatePlantillaSchema);
    const plantilla = await findPlantillaById(id);
    if (!plantilla) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    const { activo, ...rest } = payload;
    const updates: Partial<PlantillaOnboarding> = {
      ...rest,
      updatedAt: new Date(),
    };
    if (activo !== undefined) {
      updates.deletedAt = activo ? null : new Date();
    }
    const updated = await updatePlantillaById(id, updates);
    if (!updated) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }

    return c.json(toPlantillaResponse(updated));
  });

  router.delete('/:id', async (c) => {
    const { id } = parseParams(c, plantillaIdSchema);
    const plantilla = await findPlantillaById(id);
    if (!plantilla) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    await updatePlantillaById(id, { deletedAt: new Date(), updatedAt: new Date() });
    return c.json({ message: 'Plantilla eliminada' });
  });

  router.post('/:id/duplicar', async (c) => {
    const { id } = parseParams(c, plantillaIdSchema);
    const plantilla = await findPlantillaById(id);
    if (!plantilla) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    const user = c.get('user') as User;

    const duplicated = await db.transaction(async (tx) => {
      const now = new Date();
      const [newPlantilla] = await tx
        .insert(plantillasOnboarding)
        .values({
          nombre: `${plantilla.nombre} (copy)`,
          descripcion: plantilla.descripcion,
          departamentoId: plantilla.departamentoId,
          rolDestino: plantilla.rolDestino,
          duracionEstimadaDias: plantilla.duracionEstimadaDias,
          createdBy: user.id,
          deletedAt: null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const tareas = await tx
        .select()
        .from(tareasPlantilla)
        .where(eq(tareasPlantilla.plantillaId, id));

      if (tareas.length) {
        await tx.insert(tareasPlantilla).values(
          tareas.map((tarea) => ({
            plantillaId: newPlantilla.id,
            titulo: tarea.titulo,
            descripcion: tarea.descripcion,
            categoria: tarea.categoria,
            responsableTipo: tarea.responsableTipo,
            responsableId: tarea.responsableId,
            diasDesdeInicio: tarea.diasDesdeInicio,
            duracionEstimadaHoras: tarea.duracionEstimadaHoras,
            orden: tarea.orden,
            obligatoria: tarea.obligatoria,
            requiereEvidencia: tarea.requiereEvidencia,
            instrucciones: tarea.instrucciones,
            recursosUrl: tarea.recursosUrl,
            dependencias: tarea.dependencias,
            createdAt: now,
            updatedAt: now,
          }))
        );
      }

      return newPlantilla;
    });

    return c.json(toPlantillaResponse(duplicated), 201);
  });

  router.post('/:id/tareas', async (c) => {
    const { id } = parseParams(c, plantillaIdSchema);
    const plantilla = await findPlantillaById(id);
    if (!plantilla) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }

    const payload = await parseJson(c, createTareaSchema);
    const now = new Date();
    const tarea = await createTareaPlantilla({
      plantillaId: id,
      titulo: payload.titulo,
      descripcion: payload.descripcion,
      categoria: payload.categoria,
      responsableTipo: payload.responsableTipo,
      responsableId: payload.responsableId,
      diasDesdeInicio: payload.diasDesdeInicio ?? 0,
      duracionEstimadaHoras: payload.duracionEstimadaHoras?.toString(),
      orden: payload.orden,
      obligatoria: payload.obligatoria ?? true,
      requiereEvidencia: payload.requiereEvidencia ?? false,
      instrucciones: payload.instrucciones,
      recursosUrl: payload.recursosUrl,
      dependencias: payload.dependencias,
      createdAt: now,
      updatedAt: now,
    });
    if (!tarea) {
      throw new HTTPException(500, { message: 'Error al crear tarea' });
    }

    return c.json(toTareaPlantillaResponse(tarea), 201);
  });

  router.put('/:id/tareas/:tareaId', async (c) => {
    const { id, tareaId } = parseParams(c, tareaIdSchema);
    const tarea = await findTareaById(tareaId);
    if (!tarea) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    if (tarea.plantillaId !== id) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }

    const payload = await parseJson(c, updateTareaSchema);
    const { duracionEstimadaHoras, ...rest } = payload;
    const updated = await updateTareaPlantillaById(tareaId, {
      ...rest,
      duracionEstimadaHoras: duracionEstimadaHoras?.toString(),
      updatedAt: new Date(),
    });
    if (!updated) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }

    return c.json(toTareaPlantillaResponse(updated));
  });

  router.delete('/:id/tareas/:tareaId', async (c) => {
    const { id, tareaId } = parseParams(c, tareaIdSchema);
    const tarea = await findTareaById(tareaId);
    if (!tarea) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    if (tarea.plantillaId !== id) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    await deleteTareaPlantillaById(tareaId);
    return c.json({ message: 'Tarea eliminada' });
  });

  router.put('/:id/tareas/reordenar', async (c) => {
    const { id } = parseParams(c, plantillaIdSchema);
    const payload = await parseJson(c, reorderSchema);
    const tareas = await db
      .select()
      .from(tareasPlantilla)
      .where(inArray(tareasPlantilla.id, payload.orderedIds));
    if (tareas.length !== payload.orderedIds.length) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    if (tareas.some((tarea) => tarea.plantillaId !== id)) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }

    await db.transaction(async (tx) => {
      await Promise.all(
        payload.orderedIds.map((taskId, index) =>
          tx
            .update(tareasPlantilla)
            .set({ orden: index + 1, updatedAt: new Date() })
            .where(and(eq(tareasPlantilla.id, taskId), eq(tareasPlantilla.plantillaId, id)))
        )
      );
    });

    return c.json({ message: 'Tareas reordenadas' });
  });
};
