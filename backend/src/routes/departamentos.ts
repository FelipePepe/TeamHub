import type { HonoEnv } from '../types/hono.js';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { authMiddleware, requireRoles } from '../middleware/auth.js';
import { parseJson, parseParams, parseQuery } from '../validators/parse.js';
import { optionalBooleanFromString, uuidSchema } from '../validators/common.js';
import { toDepartamentoResponse, toUserResponse } from '../services/mappers.js';
import { db } from '../db/index.js';
import { departamentos } from '../db/schema/departamentos.js';
import { users } from '../db/schema/users.js';
import { and, eq, ilike, isNotNull, isNull, or, sql } from 'drizzle-orm';
import type { Departamento } from '../db/schema/departamentos.js';
import {
  createDepartamento,
  findDepartamentoById,
  findDepartamentoByNombreOrCodigo,
  findDepartamentoByNombreOrCodigoExcludingId,
  updateDepartamentoById,
} from '../services/departamentos-repository.js';

const listQuerySchema = z.object({
  search: z.string().optional(),
  activo: optionalBooleanFromString,
});

const createDepartamentoSchema = z.object({
  nombre: z.string().min(1),
  codigo: z.string().min(1),
  descripcion: z.string().optional(),
  responsableId: uuidSchema.optional(),
  color: z.string().optional(),
});

const updateDepartamentoSchema = z.object({
  nombre: z.string().min(1).optional(),
  codigo: z.string().min(1).optional(),
  descripcion: z.string().optional(),
  responsableId: uuidSchema.optional(),
  color: z.string().optional(),
  activo: z.boolean().optional(),
});

const idParamsSchema = z.object({
  id: uuidSchema,
});

export const departamentosRoutes = new Hono<HonoEnv>();

departamentosRoutes.use('*', authMiddleware);

const buildDepartamentoFilters = (query: z.infer<typeof listQuerySchema>) => {
  const filters = [];
  if (query.search) {
    const search = `%${query.search}%`;
    filters.push(or(ilike(departamentos.nombre, search), ilike(departamentos.codigo, search)));
  }
  if (query.activo === undefined) {
    filters.push(isNull(departamentos.deletedAt));
  } else {
    filters.push(query.activo ? isNull(departamentos.deletedAt) : isNotNull(departamentos.deletedAt));
  }
  return filters;
};

departamentosRoutes.get('/', async (c) => {
  const query = parseQuery(c, listQuerySchema);
  const filters = buildDepartamentoFilters({
    search: query.search,
    activo: query.activo,
  });
  const whereClause = filters.length ? and(...filters) : undefined;
  const baseQuery = db
    .select({
      departamento: departamentos,
      usuariosCount: sql<number>`count(${users.id})`.as('usuarios_count'),
    })
    .from(departamentos)
    .leftJoin(users, and(eq(users.departamentoId, departamentos.id), isNull(users.deletedAt)))
    .groupBy(departamentos.id);
  const list = await (whereClause ? baseQuery.where(whereClause) : baseQuery);

  return c.json({
    data: list.map((row) => ({
      ...toDepartamentoResponse(row.departamento),
      _count: { usuarios: Number(row.usuariosCount) },
    })),
  });
});

departamentosRoutes.post('/', requireRoles('ADMIN', 'RRHH'), async (c) => {
  const payload = await parseJson(c, createDepartamentoSchema);
  const existing = await findDepartamentoByNombreOrCodigo(payload.nombre, payload.codigo);
  if (existing) {
    throw new HTTPException(400, { message: 'El departamento ya existe' });
  }
  const now = new Date();
  const departamento: Departamento | null = await createDepartamento({
    nombre: payload.nombre,
    codigo: payload.codigo,
    descripcion: payload.descripcion,
    responsableId: payload.responsableId,
    color: payload.color,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  });
  if (!departamento) {
    throw new HTTPException(500, { message: 'Error al crear departamento' });
  }

  return c.json(toDepartamentoResponse(departamento), 201);
});

departamentosRoutes.get('/:id', async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const departamento = await findDepartamentoById(id);
  if (!departamento) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }
  return c.json(toDepartamentoResponse(departamento));
});

departamentosRoutes.put('/:id', requireRoles('ADMIN', 'RRHH'), async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const payload = await parseJson(c, updateDepartamentoSchema);
  const departamento = await findDepartamentoById(id);
  if (!departamento) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }

  const conflict = await findDepartamentoByNombreOrCodigoExcludingId(
    payload.nombre,
    payload.codigo,
    id
  );
  if (conflict) {
    throw new HTTPException(400, { message: 'El departamento ya existe' });
  }

  const { activo, ...rest } = payload;
  const updates: Partial<Departamento> = {
    ...rest,
    updatedAt: new Date(),
  };
  if (activo !== undefined) {
    updates.deletedAt = activo ? null : new Date();
  }
  const updated = await updateDepartamentoById(id, updates);
  if (!updated) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }

  return c.json(toDepartamentoResponse(updated));
});

departamentosRoutes.delete('/:id', requireRoles('ADMIN', 'RRHH'), async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const departamento = await findDepartamentoById(id);
  if (!departamento) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }
  await updateDepartamentoById(id, { deletedAt: new Date(), updatedAt: new Date() });
  return c.json({ message: 'Departamento desactivado' });
});

departamentosRoutes.get('/:id/empleados', async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const departamento = await findDepartamentoById(id);
  if (!departamento) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }

  const empleados = await db
    .select()
    .from(users)
    .where(and(eq(users.departamentoId, id), isNull(users.deletedAt)));

  return c.json({ data: empleados.map(toUserResponse) });
});

departamentosRoutes.get('/:id/estadisticas', async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const departamento = await findDepartamentoById(id);
  if (!departamento) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }

  const empleados = await db
    .select({ id: users.id, rol: users.rol })
    .from(users)
    .where(and(eq(users.departamentoId, id), isNull(users.deletedAt)));

  const empleadosPorRol = empleados.reduce<Record<string, number>>((acc, user) => {
    acc[user.rol] = (acc[user.rol] ?? 0) + 1;
    return acc;
  }, {});

  return c.json({
    totalEmpleados: empleados.length,
    empleadosPorRol,
    onboardingsActivos: 0,
  });
});
