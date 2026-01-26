import type { HonoEnv } from '../types/hono.js';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { authMiddleware, requireRoles } from '../middleware/auth.js';
import { parseJson, parseParams, parseQuery } from '../validators/parse.js';
import {
  emailSchema,
  optionalBooleanFromString,
  optionalNumberFromString,
  uuidSchema,
} from '../validators/common.js';
import { passwordSchema } from '../validators/auth.js';
import { hashPassword, verifyPassword } from '../services/auth-service.js';
import { toProyectoResponse, toUserResponse } from '../services/mappers.js';
import { users } from '../db/schema/users.js';
import { asignaciones, proyectos } from '../db/schema/proyectos.js';
import { db } from '../db/index.js';
import { and, eq, ilike, isNotNull, isNull, or, sql } from 'drizzle-orm';
import type { User } from '../db/schema/users.js';
import { createUser, findUserByEmail, findUserById, updateUserById } from '../services/users-repository.js';

const roles = ['ADMIN', 'RRHH', 'MANAGER', 'EMPLEADO'] as const;

const listQuerySchema = z.object({
  search: z.string().optional(),
  rol: z.enum(roles).optional(),
  departamentoId: uuidSchema.optional(),
  activo: optionalBooleanFromString,
  page: optionalNumberFromString,
  limit: optionalNumberFromString,
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  nombre: z.string().min(1),
  apellidos: z.string().optional(),
  rol: z.enum(roles).optional(),
  departamentoId: uuidSchema.optional(),
  managerId: uuidSchema.optional(),
  activo: z.boolean().optional(),
});

const updateUserSchema = z.object({
  email: emailSchema.optional(),
  nombre: z.string().min(1).optional(),
  apellidos: z.string().optional(),
  rol: z.enum(roles).optional(),
  departamentoId: uuidSchema.optional(),
  managerId: uuidSchema.optional(),
  activo: z.boolean().optional(),
});

const toNumber = (value: unknown, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: passwordSchema,
});

const idParamsSchema = z.object({
  id: uuidSchema,
});

const PRIVILEGED_ROLES: User['rol'][] = ['ADMIN', 'RRHH'];

const isPrivilegedUser = (user: User) => PRIVILEGED_ROLES.includes(user.rol);

const requireSelfOrPrivileged = (currentUser: User, targetId: string) => {
  if (currentUser.id !== targetId && !isPrivilegedUser(currentUser)) {
    throw new HTTPException(403, { message: 'Acceso denegado' });
  }
};

export const usuariosRoutes = new Hono<HonoEnv>();

const buildUserFilters = (query: z.infer<typeof listQuerySchema>) => {
  const filters = [];
  if (query.search) {
    const search = `%${query.search}%`;
    filters.push(or(ilike(users.email, search), ilike(users.nombre, search)));
  }
  if (query.rol) {
    filters.push(eq(users.rol, query.rol));
  }
  if (query.departamentoId) {
    filters.push(eq(users.departamentoId, query.departamentoId));
  }
  if (query.activo !== undefined) {
    filters.push(query.activo ? isNull(users.deletedAt) : isNotNull(users.deletedAt));
  }
  return filters;
};

usuariosRoutes.use('*', authMiddleware);

usuariosRoutes.get('/', async (c) => {
  const query = parseQuery(c, listQuerySchema);
  const filters = buildUserFilters({
    search: query.search,
    rol: query.rol,
    departamentoId: query.departamentoId,
    activo: query.activo,
  });
  const whereClause = filters.length ? and(...filters) : undefined;

  const countBaseQuery = db.select({ count: sql<number>`count(*)` }).from(users);
  const totalResult = await (whereClause ? countBaseQuery.where(whereClause) : countBaseQuery);
  const total = Number(totalResult[0]?.count ?? 0);

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const baseQuery = db.select().from(users);
  const queryWithWhere = whereClause ? baseQuery.where(whereClause) : baseQuery;
  const list = await queryWithWhere.limit(limit).offset((page - 1) * limit);

  return c.json({
    data: list.map(toUserResponse),
    meta: {
      page,
      limit,
      total,
    },
  });
});

usuariosRoutes.post('/', requireRoles('ADMIN', 'RRHH'), async (c) => {
  const payload = await parseJson(c, createUserSchema);

  const existing = await findUserByEmail(payload.email);
  if (existing) {
    throw new HTTPException(400, { message: 'El email ya existe' });
  }

  const now = new Date();
  const user = await createUser({
    email: payload.email,
    nombre: payload.nombre,
    apellidos: payload.apellidos,
    rol: payload.rol ?? 'EMPLEADO',
    departamentoId: payload.departamentoId,
    managerId: payload.managerId,
    passwordHash: await hashPassword(payload.password),
    passwordTemporal: true,
    mfaEnabled: false,
    failedLoginAttempts: 0,
    deletedAt: payload.activo === false ? now : null,
    createdAt: now,
    updatedAt: now,
  });
  if (!user) {
    throw new HTTPException(500, { message: 'Error al crear usuario' });
  }

  return c.json(toUserResponse(user), 201);
});

usuariosRoutes.get('/:id', async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const user = await findUserById(id);
  if (!user) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }
  return c.json(toUserResponse(user));
});

usuariosRoutes.put('/:id', async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const currentUser = c.get('user') as User;
  const payload = await parseJson(c, updateUserSchema);
  const user = await findUserById(id);
  if (!user) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }

  requireSelfOrPrivileged(currentUser, id);

  // Non-privileged users cannot change rol or activo
  if (!isPrivilegedUser(currentUser)) {
    if (payload.rol !== undefined || payload.activo !== undefined) {
      throw new HTTPException(403, { message: 'Acceso denegado' });
    }
  }

  if (payload.email) {
    const existing = await findUserByEmail(payload.email);
    if (existing && existing.id !== id) {
      throw new HTTPException(400, { message: 'El email ya existe' });
    }
  }

  const { activo, ...rest } = payload;
  const updates: Partial<User> = {
    ...rest,
    updatedAt: new Date(),
  };
  if (activo !== undefined) {
    updates.deletedAt = activo ? null : new Date();
  }

  const updated = await updateUserById(user.id, updates);
  if (!updated) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }

  return c.json(toUserResponse(updated));
});

usuariosRoutes.delete('/:id', requireRoles('ADMIN', 'RRHH'), async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const user = await findUserById(id);
  if (!user) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }
  await updateUserById(id, { deletedAt: new Date(), updatedAt: new Date() });
  return c.json({ message: 'Usuario desactivado' });
});

usuariosRoutes.patch('/:id/password', async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const currentUser = c.get('user') as User;

  // Only the user themselves can change their password
  if (currentUser.id !== id) {
    throw new HTTPException(403, { message: 'Acceso denegado' });
  }

  const payload = await parseJson(c, changePasswordSchema);
  const user = await findUserById(id);
  if (!user) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }
  const valid = await verifyPassword(payload.oldPassword, user.passwordHash);
  if (!valid) {
    throw new HTTPException(401, { message: 'No autorizado' });
  }
  const updated = await updateUserById(user.id, {
    passwordHash: await hashPassword(payload.newPassword),
    updatedAt: new Date(),
  });
  if (!updated) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }
  return c.json(toUserResponse(updated));
});

usuariosRoutes.patch('/:id/restore', requireRoles('ADMIN', 'RRHH'), async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const user = await findUserById(id);
  if (!user) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }
  const updated = await updateUserById(user.id, { deletedAt: null, updatedAt: new Date() });
  if (!updated) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }
  return c.json(toUserResponse(updated));
});

usuariosRoutes.patch('/:id/reset-password', requireRoles('ADMIN', 'RRHH'), async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const user = await findUserById(id);
  if (!user) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }
  if (user.deletedAt) {
    throw new HTTPException(400, { message: 'El usuario esta inactivo' });
  }

  // Generate a cryptographically secure temporary password
  const { randomBytes } = await import('node:crypto');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  const randomBuffer = randomBytes(16);
  let tempPassword = '';
  for (let i = 0; i < 16; i++) {
    tempPassword += chars.charAt(randomBuffer[i] % chars.length);
  }
  // Ensure it meets the password policy
  tempPassword = tempPassword.slice(0, 12) + 'Aa1!';

  await updateUserById(user.id, {
    passwordHash: await hashPassword(tempPassword),
    passwordTemporal: true,
    mfaEnabled: false,
    mfaSecret: null,
    updatedAt: new Date(),
  });

  return c.json({
    message: 'Contraseña temporal generada',
    tempPassword,
  });
});

usuariosRoutes.patch('/:id/unlock', requireRoles('ADMIN'), async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const user = await findUserById(id);
  if (!user) {
    throw new HTTPException(404, { message: 'No encontrado' });
  }
  await updateUserById(user.id, {
    failedLoginAttempts: 0,
    lockedUntil: null,
    updatedAt: new Date(),
  });
  return c.json({ message: 'Usuario desbloqueado' });
});

usuariosRoutes.get('/:id/proyectos', async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const rows = await db
    .select({ proyecto: proyectos })
    .from(asignaciones)
    .innerJoin(proyectos, eq(asignaciones.proyectoId, proyectos.id))
    .where(eq(asignaciones.usuarioId, id));
  return c.json({ data: rows.map((row) => toProyectoResponse(row.proyecto)) });
});

usuariosRoutes.get('/:id/carga', async (c) => {
  const { id } = parseParams(c, idParamsSchema);
  const rows = await db
    .select({ dedicacionPorcentaje: asignaciones.dedicacionPorcentaje })
    .from(asignaciones)
    .where(eq(asignaciones.usuarioId, id));
  const dedicacionTotal = rows.reduce(
    (total, item) => total + toNumber(item.dedicacionPorcentaje, 0),
    0
  );
  return c.json({
    usuarioId: id,
    dedicacionTotal,
  });
});
