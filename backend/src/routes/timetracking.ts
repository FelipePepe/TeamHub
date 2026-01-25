import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { and, eq, inArray } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import { parseJson, parseParams, parseQuery } from '../validators/parse';
import {
  dateSchema,
  optionalBooleanFromString,
  optionalNumberFromString,
  uuidSchema,
} from '../validators/common';
import { toTimetrackingResponse } from '../services/mappers';
import { db } from '../db';
import { timetracking } from '../db/schema/timetracking';
import { proyectos } from '../db/schema/proyectos';
import { users } from '../db/schema/users';
import type { User } from '../db/schema/users';
import {
  createTimetracking,
  deleteTimetrackingById,
  findTimetrackingById,
  listTimetracking,
  updateTimetrackingById,
} from '../services/timetracking-repository';

const estados = ['PENDIENTE', 'APROBADO', 'RECHAZADO'] as const;

const listQuerySchema = z.object({
  usuarioId: uuidSchema.optional(),
  proyectoId: uuidSchema.optional(),
  estado: z.enum(estados).optional(),
  fechaInicio: dateSchema.optional(),
  fechaFin: dateSchema.optional(),
  facturable: optionalBooleanFromString,
  page: optionalNumberFromString,
  limit: optionalNumberFromString,
});

const createRegistroSchema = z.object({
  proyectoId: uuidSchema,
  usuarioId: uuidSchema.optional(),
  fecha: dateSchema,
  horas: z.number().positive().max(24),
  descripcion: z.string().min(1),
  facturable: z.boolean().optional(),
});

const updateRegistroSchema = z.object({
  fecha: dateSchema.optional(),
  horas: z.number().positive().max(24).optional(),
  descripcion: z.string().min(1).optional(),
  facturable: z.boolean().optional(),
});

const approveSchema = z
  .object({
    comentario: z.string().optional(),
  })
  .optional();

const rejectSchema = z.object({
  comentario: z.string().min(1),
});

const bulkApproveSchema = z.object({
  ids: z.array(uuidSchema),
});

const copySchema = z.object({
  fechaOrigen: dateSchema,
  fechaDestino: dateSchema,
});

const idParamsSchema = z.object({
  id: uuidSchema,
});

const semanaParamsSchema = z.object({
  fecha: dateSchema,
});

const toNumber = (value: unknown, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const timetrackingRoutes = new Hono();

timetrackingRoutes.use('*', authMiddleware);

timetrackingRoutes.get('/', async (c) => {
  const query = parseQuery(c, listQuerySchema);
  const registros = await listTimetracking(
    {
      usuarioId: query.usuarioId,
      proyectoId: query.proyectoId,
      estado: query.estado,
      fechaInicio: query.fechaInicio,
      fechaFin: query.fechaFin,
      facturable: query.facturable,
    },
    { page: query.page, limit: query.limit }
  );

  return c.json({ data: registros.map(toTimetrackingResponse) });
});

timetrackingRoutes.post('/', async (c) => {
  const payload = await parseJson(c, createRegistroSchema);
  const user = c.get('user') as User;
  const now = new Date();
  const registro = await createTimetracking({
    usuarioId: payload.usuarioId ?? user.id,
    proyectoId: payload.proyectoId,
    fecha: payload.fecha,
    horas: payload.horas,
    descripcion: payload.descripcion,
    facturable: payload.facturable ?? true,
    estado: 'PENDIENTE',
    createdAt: now,
    updatedAt: now,
  });
  if (!registro) {
    throw new HTTPException(500, { message: 'Error al crear registro' });
  }

  return c.json(toTimetrackingResponse(registro), 201);
});

timetrackingRoutes.get('/mis-registros', async (c) => {
  const user = c.get('user') as User;
  const registros = await listTimetracking({ usuarioId: user.id });
  return c.json({ data: registros.map(toTimetrackingResponse) });
});

timetrackingRoutes.get('/semana/:fecha', async (c) => {
  const { fecha } = parseParams(c, semanaParamsSchema);
  const registros = await listTimetracking({ fechaInicio: fecha, fechaFin: fecha });
  return c.json({ data: registros.map(toTimetrackingResponse) });
});

timetrackingRoutes.post('/aprobar-masivo', async (c) => {
  const payload = await parseJson(c, bulkApproveSchema);
  const user = c.get('user') as User;
  const now = new Date();
  if (payload.ids.length) {
    await db
      .update(timetracking)
      .set({
        estado: 'APROBADO',
        aprobadoPor: user.id,
        aprobadoAt: now,
        rechazadoPor: null,
        rechazadoAt: null,
        comentarioRechazo: null,
        updatedAt: now,
      })
      .where(inArray(timetracking.id, payload.ids));
  }

  return c.json({ message: 'Aprobación masiva completada' });
});

timetrackingRoutes.get('/pendientes-aprobacion', async (c) => {
  const rows = await db
    .select({
      registro: timetracking,
      usuarioNombre: users.nombre,
      proyectoNombre: proyectos.nombre,
    })
    .from(timetracking)
    .innerJoin(users, eq(timetracking.usuarioId, users.id))
    .innerJoin(proyectos, eq(timetracking.proyectoId, proyectos.id))
    .where(eq(timetracking.estado, 'PENDIENTE'));

  const grouped = new Map<
    string,
    {
      usuarioId: string;
      usuarioNombre?: string;
      proyectoId: string;
      proyectoNombre?: string;
      totalHoras: number;
      registros: ReturnType<typeof toTimetrackingResponse>[];
    }
  >();

  rows.forEach(({ registro, usuarioNombre, proyectoNombre }) => {
    const key = `${registro.usuarioId}:${registro.proyectoId}`;
    const existing = grouped.get(key);
    const horas = toNumber(registro.horas, 0);
    if (existing) {
      existing.totalHoras += horas;
      existing.registros.push(toTimetrackingResponse(registro));
    } else {
      grouped.set(key, {
        usuarioId: registro.usuarioId,
        usuarioNombre,
        proyectoId: registro.proyectoId,
        proyectoNombre,
        totalHoras: horas,
        registros: [toTimetrackingResponse(registro)],
      });
    }
  });

  return c.json({ data: Array.from(grouped.values()) });
});

timetrackingRoutes.get('/resumen', async (c) => {
  const query = parseQuery(c, listQuerySchema);
  const clauses = [];
  if (query.usuarioId) {
    clauses.push(eq(timetracking.usuarioId, query.usuarioId));
  }
  if (query.proyectoId) {
    clauses.push(eq(timetracking.proyectoId, query.proyectoId));
  }

  let queryBuilder = db
    .select({ registro: timetracking, proyectoNombre: proyectos.nombre })
    .from(timetracking)
    .innerJoin(proyectos, eq(timetracking.proyectoId, proyectos.id));
  if (clauses.length) {
    queryBuilder = queryBuilder.where(and(...clauses));
  }
  const rows = await queryBuilder;

  const totalHoras = rows.reduce((sum, item) => sum + toNumber(item.registro.horas, 0), 0);
  const horasFacturables = rows
    .filter((item) => item.registro.facturable)
    .reduce((sum, item) => sum + toNumber(item.registro.horas, 0), 0);
  const horasNoFacturables = totalHoras - horasFacturables;

  const porProyecto = Array.from(
    rows.reduce<
      Map<string, { proyectoId: string; nombre?: string; horas: number }>
    >((acc, item) => {
      const existing = acc.get(item.registro.proyectoId) ?? {
        proyectoId: item.registro.proyectoId,
        nombre: item.proyectoNombre,
        horas: 0,
      };
      existing.horas += toNumber(item.registro.horas, 0);
      acc.set(item.registro.proyectoId, existing);
      return acc;
    }, new Map())
  ).map((entry) => entry[1]);

  const porDia = Array.from(
    rows.reduce<Map<string, { fecha: string; horas: number }>>((acc, item) => {
      const fecha = String(item.registro.fecha);
      const existing = acc.get(fecha) ?? { fecha, horas: 0 };
      existing.horas += toNumber(item.registro.horas, 0);
      acc.set(fecha, existing);
      return acc;
    }, new Map())
  ).map((entry) => entry[1]);

  const porEstado = Array.from(
    rows.reduce<Map<string, { estado: string; horas: number }>>((acc, item) => {
      const estado = String(item.registro.estado);
      const existing = acc.get(estado) ?? { estado, horas: 0 };
      existing.horas += toNumber(item.registro.horas, 0);
      acc.set(estado, existing);
      return acc;
    }, new Map())
  ).map((entry) => entry[1]);

  return c.json({
    totalHoras,
    horasFacturables,
    horasNoFacturables,
    porProyecto,
    porDia,
    porEstado,
  });
});

timetrackingRoutes.post('/copiar', async (c) => {
  const payload = await parseJson(c, copySchema);
  const user = c.get('user') as User;
  const registros = await db
    .select()
    .from(timetracking)
    .where(and(eq(timetracking.usuarioId, user.id), eq(timetracking.fecha, payload.fechaOrigen)));

  const now = new Date();
  if (registros.length) {
    await db.insert(timetracking).values(
      registros.map((registro) => ({
        usuarioId: registro.usuarioId,
        proyectoId: registro.proyectoId,
        asignacionId: registro.asignacionId,
        fecha: payload.fechaDestino,
        horas: registro.horas,
        descripcion: registro.descripcion,
        facturable: registro.facturable,
        estado: 'PENDIENTE',
        aprobadoPor: null,
        aprobadoAt: null,
        rechazadoPor: null,
        rechazadoAt: null,
        comentarioRechazo: null,
        createdAt: now,
        updatedAt: now,
      }))
    );
  }

  return c.json({ copied: registros.length, message: 'Registros copiados' });
});

timetrackingRoutes.get('/:id', async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const registro = await findTimetrackingById(id);
  if (!registro) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }
  return c.json(toTimetrackingResponse(registro));
});

timetrackingRoutes.put('/:id', async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const payload = await parseJson(c, updateRegistroSchema);
  const registro = await findTimetrackingById(id);
  if (!registro) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }

  const updated = await updateTimetrackingById(id, { ...payload, updatedAt: new Date() });
  if (!updated) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }

  return c.json(toTimetrackingResponse(updated));
});

timetrackingRoutes.delete('/:id', async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const registro = await findTimetrackingById(id);
  if (!registro) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }
  await deleteTimetrackingById(id);
  return c.json({ message: 'Registro eliminado' });
});

timetrackingRoutes.patch('/:id/aprobar', async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  await parseJson(c, approveSchema ?? z.object({}));
  const registro = await findTimetrackingById(id);
  if (!registro) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }
  const user = c.get('user') as User;
  const updated = await updateTimetrackingById(id, {
    estado: 'APROBADO',
    aprobadoPor: user.id,
    aprobadoAt: new Date(),
    rechazadoPor: null,
    rechazadoAt: null,
    comentarioRechazo: null,
    updatedAt: new Date(),
  });
  if (!updated) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }
  return c.json(toTimetrackingResponse(updated));
});

timetrackingRoutes.patch('/:id/rechazar', async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const payload = await parseJson(c, rejectSchema);
  const registro = await findTimetrackingById(id);
  if (!registro) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }
  const user = c.get('user') as User;
  const updated = await updateTimetrackingById(id, {
    estado: 'RECHAZADO',
    rechazadoPor: user.id,
    rechazadoAt: new Date(),
    aprobadoPor: null,
    aprobadoAt: null,
    comentarioRechazo: payload.comentario,
    updatedAt: new Date(),
  });
  if (!updated) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }
  return c.json(toTimetrackingResponse(updated));
});
