import type { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { eq } from 'drizzle-orm';
import type { HonoEnv } from '../../types/hono.js';
import { authMiddleware } from '../../middleware/auth.js';
import { parseJson, parseParams, parseQuery } from '../../validators/parse.js';
import { toAsignacionResponse, toProyectoResponse } from '../../services/mappers.js';
import { db } from '../../db/index.js';
import { asignaciones, proyectos } from '../../db/schema/proyectos.js';
import type { User } from '../../db/schema/users.js';
import {
  createAsignacion,
  createProyecto,
  findAsignacionById,
  findProyectoByCodigo,
  findProyectoById,
  listAsignacionesByProyectoId,
  listProyectos,
  updateAsignacionById,
  updateProyectoById,
} from '../../services/proyectos-repository.js';
import {
  asignacionParamsSchema,
  createAsignacionSchema,
  createProyectoSchema,
  idParamsSchema,
  listQuerySchema,
  updateAsignacionSchema,
  updateEstadoSchema,
  updateProyectoSchema,
} from './schemas.js';
import { todayDate, toNumber } from './helpers.js';

export const registerProyectosRoutes = (router: Hono<HonoEnv>) => {
  router.use('*', authMiddleware);

  router.get('/', async (c) => {
    const query = parseQuery(c, listQuerySchema);
    const list = await listProyectos({
      estado: query.estado,
      managerId: query.managerId,
      cliente: query.cliente,
      fechaInicio: query.fechaInicio,
      fechaFin: query.fechaFin,
    });

    return c.json({ data: list.map(toProyectoResponse) });
  });

  router.post('/', async (c) => {
    const payload = await parseJson(c, createProyectoSchema);
    const existing = await findProyectoByCodigo(payload.codigo);
    if (existing) {
      throw new HTTPException(400, { message: 'El proyecto ya existe' });
    }
    const user = c.get('user') as User;
    const now = new Date();
    const proyecto = await createProyecto({
      nombre: payload.nombre,
      descripcion: payload.descripcion,
      codigo: payload.codigo,
      cliente: payload.cliente,
      fechaInicio: payload.fechaInicio,
      fechaFinEstimada: payload.fechaFinEstimada,
      estado: 'PLANIFICACION',
      managerId: user.id,
      presupuestoHoras: payload.presupuestoHoras?.toString(),
      prioridad: payload.prioridad,
      color: payload.color,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
    if (!proyecto) {
      throw new HTTPException(500, { message: 'Error al crear proyecto' });
    }

    return c.json(toProyectoResponse(proyecto), 201);
  });

  router.get('/mis-proyectos', async (c) => {
    const user = c.get('user') as User;
    const rows = await db
      .select({ proyecto: proyectos })
      .from(asignaciones)
      .innerJoin(proyectos, eq(asignaciones.proyectoId, proyectos.id))
      .where(eq(asignaciones.usuarioId, user.id));

    return c.json({ data: rows.map((row) => toProyectoResponse(row.proyecto)) });
  });

  router.get('/:id', async (c) => {
    const { id } = parseParams(c, idParamsSchema);
    const proyecto = await findProyectoById(id);
    if (!proyecto) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    return c.json(toProyectoResponse(proyecto));
  });

  router.put('/:id', async (c) => {
    const { id } = parseParams(c, idParamsSchema);
    const payload = await parseJson(c, updateProyectoSchema);
    const proyecto = await findProyectoById(id);
    if (!proyecto) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }

    const { activo, presupuestoHoras, ...rest } = payload;
    const updates: Parameters<typeof updateProyectoById>[1] = {
      ...rest,
      presupuestoHoras: presupuestoHoras?.toString(),
      updatedAt: new Date(),
    };
    if (activo !== undefined) {
      updates.deletedAt = activo ? null : new Date();
    }
    const updated = await updateProyectoById(id, updates);
    if (!updated) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }

    return c.json(toProyectoResponse(updated));
  });

  router.delete('/:id', async (c) => {
    const { id } = parseParams(c, idParamsSchema);
    const proyecto = await findProyectoById(id);
    if (!proyecto) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    await updateProyectoById(id, { deletedAt: new Date(), updatedAt: new Date() });
    return c.json({ message: 'Proyecto eliminado' });
  });

  router.patch('/:id/estado', async (c) => {
    const { id } = parseParams(c, idParamsSchema);
    const payload = await parseJson(c, updateEstadoSchema);
    const proyecto = await findProyectoById(id);
    if (!proyecto) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    const updated = await updateProyectoById(id, { estado: payload.estado, updatedAt: new Date() });
    if (!updated) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    return c.json(toProyectoResponse(updated));
  });

  router.get('/:id/estadisticas', async (c) => {
    const { id } = parseParams(c, idParamsSchema);
    const proyecto = await findProyectoById(id);
    if (!proyecto) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }

    const asignacionesList = await listAsignacionesByProyectoId(id);
    const asignacionesActivas = asignacionesList.filter((item) => !item.deletedAt).length;

    const presupuestoHoras = toNumber(proyecto.presupuestoHoras, 0);
    const horasConsumidas = toNumber(proyecto.horasConsumidas, 0);
    const progreso = presupuestoHoras ? horasConsumidas / presupuestoHoras : 0;

    return c.json({
      presupuestoHoras,
      horasConsumidas,
      asignacionesActivas,
      progreso,
    });
  });

  router.get('/:id/asignaciones', async (c) => {
    const { id } = parseParams(c, idParamsSchema);
    const list = await listAsignacionesByProyectoId(id);
    return c.json({ data: list.map(toAsignacionResponse) });
  });

  router.post('/:id/asignaciones', async (c) => {
    const { id } = parseParams(c, idParamsSchema);
    const proyecto = await findProyectoById(id);
    if (!proyecto) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }

    const payload = await parseJson(c, createAsignacionSchema);
    const now = new Date();
    const asignacion = await createAsignacion({
      proyectoId: id,
      usuarioId: payload.usuarioId,
      rol: payload.rol,
      dedicacionPorcentaje: payload.dedicacionPorcentaje?.toString(),
      horasSemanales: payload.horasSemanales?.toString(),
      fechaInicio: payload.fechaInicio,
      fechaFin: payload.fechaFin,
      notas: payload.notas,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
    if (!asignacion) {
      throw new HTTPException(500, { message: 'Error al crear asignación' });
    }

    return c.json(toAsignacionResponse(asignacion), 201);
  });

  router.get('/:id/asignaciones/:asigId', async (c) => {
    const { asigId } = parseParams(c, asignacionParamsSchema);
    const asignacion = await findAsignacionById(asigId);
    if (!asignacion) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    return c.json(toAsignacionResponse(asignacion));
  });

  router.put('/:id/asignaciones/:asigId', async (c) => {
    const { asigId } = parseParams(c, asignacionParamsSchema);
    const payload = await parseJson(c, updateAsignacionSchema);
    const asignacion = await findAsignacionById(asigId);
    if (!asignacion) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }

    const { activo, dedicacionPorcentaje, horasSemanales, ...rest } = payload;
    const updates: Parameters<typeof updateAsignacionById>[1] = {
      ...rest,
      dedicacionPorcentaje: dedicacionPorcentaje?.toString(),
      horasSemanales: horasSemanales?.toString(),
      updatedAt: new Date(),
    };
    if (activo !== undefined) {
      updates.deletedAt = activo ? null : new Date();
    }
    const updated = await updateAsignacionById(asigId, updates);
    if (!updated) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }

    return c.json(toAsignacionResponse(updated));
  });

  router.delete('/:id/asignaciones/:asigId', async (c) => {
    const { asigId } = parseParams(c, asignacionParamsSchema);
    const asignacion = await findAsignacionById(asigId);
    if (!asignacion) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    await updateAsignacionById(asigId, { deletedAt: new Date(), updatedAt: new Date() });
    return c.json({ message: 'Asignación eliminada' });
  });

  router.patch('/:id/asignaciones/:asigId/finalizar', async (c) => {
    const { asigId } = parseParams(c, asignacionParamsSchema);
    const asignacion = await findAsignacionById(asigId);
    if (!asignacion) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    const updated = await updateAsignacionById(asigId, {
      deletedAt: new Date(),
      fechaFin: todayDate(),
      updatedAt: new Date(),
    });
    if (!updated) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    return c.json(toAsignacionResponse(updated));
  });
};
