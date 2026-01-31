import type { HonoEnv } from '../types/hono.js';
import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { parseJson, parseParams } from '../validators/parse.js';
import { uuidSchema } from '../validators/common.js';
import {
  createTareaSchema,
  updateTareaSchema,
  updateEstadoSchema,
  reasignarTareaSchema,
} from '../validators/tareas.validators.js';
import { tareasService } from '../services/tareas.service.js';
import { toTareaResponse } from '../services/mappers.js';
import type { User } from '../db/schema/users.js';

const idParamsSchema = z.object({
  id: uuidSchema,
});

const proyectoIdParamsSchema = z.object({
  proyectoId: uuidSchema,
});

const usuarioIdParamsSchema = z.object({
  usuarioId: uuidSchema,
});

export const tareasRoutes = new Hono<HonoEnv>();

tareasRoutes.use('*', authMiddleware);

// GET /api/proyectos/:proyectoId/tareas - Listar tareas del proyecto
tareasRoutes.get('/proyectos/:proyectoId/tareas', async (c) => {
  const { proyectoId } = parseParams(c, proyectoIdParamsSchema);
  const user = c.get('user') as User;

  const tareas = await tareasService.listByProyecto(proyectoId, user);
  return c.json({ data: tareas.map(toTareaResponse) });
});

// GET /api/usuarios/:usuarioId/tareas - Mis tareas asignadas
tareasRoutes.get('/usuarios/:usuarioId/tareas', async (c) => {
  const { usuarioId } = parseParams(c, usuarioIdParamsSchema);
  const user = c.get('user') as User;

  const tareas = await tareasService.listByUsuario(usuarioId, user);
  return c.json({ data: tareas.map(toTareaResponse) });
});

// GET /api/tareas/:id - Detalle de tarea
tareasRoutes.get('/tareas/:id', async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const user = c.get('user') as User;

  const tarea = await tareasService.getById(id, user);
  return c.json(toTareaResponse(tarea));
});

// POST /api/proyectos/:proyectoId/tareas - Crear tarea
tareasRoutes.post('/proyectos/:proyectoId/tareas', async (c) => {
  const { proyectoId } = parseParams(c, proyectoIdParamsSchema);
  const payload = await parseJson(c, createTareaSchema);
  const user = c.get('user') as User;

  const tarea = await tareasService.create(proyectoId, payload, user);
  return c.json(toTareaResponse(tarea), 201);
});

// PUT /api/tareas/:id - Actualizar tarea
tareasRoutes.put('/tareas/:id', async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const payload = await parseJson(c, updateTareaSchema);
  const user = c.get('user') as User;

  const tarea = await tareasService.update(id, payload, user);
  return c.json(toTareaResponse(tarea));
});

// PATCH /api/tareas/:id/estado - Cambiar estado
tareasRoutes.patch('/tareas/:id/estado', async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const payload = await parseJson(c, updateEstadoSchema);
  const user = c.get('user') as User;

  const tarea = await tareasService.updateEstado(id, payload.estado, user);
  return c.json(toTareaResponse(tarea));
});

// PATCH /api/tareas/:id/asignar - Reasignar usuario
tareasRoutes.patch('/tareas/:id/asignar', async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const payload = await parseJson(c, reasignarTareaSchema);
  const user = c.get('user') as User;

  const tarea = await tareasService.reasignar(id, payload.usuarioAsignadoId, user);
  return c.json(toTareaResponse(tarea));
});

// DELETE /api/tareas/:id - Eliminar tarea
tareasRoutes.delete('/tareas/:id', async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const user = c.get('user') as User;

  await tareasService.delete(id, user);
  return c.json({ message: 'Tarea eliminada' });
});
