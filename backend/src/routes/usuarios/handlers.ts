import type { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { and, eq, isNull, sql } from 'drizzle-orm';
import type { HonoEnv } from '../../types/hono.js';
import { authMiddleware, requireRoles } from '../../middleware/auth.js';
import { parseJson, parseParams, parseQuery } from '../../validators/parse.js';
import { hashPassword, verifyPassword } from '../../services/auth-service.js';
import { toProyectoResponse, toUserResponse } from '../../services/mappers.js';
import { users } from '../../db/schema/users.js';
import { departamentos } from '../../db/schema/departamentos.js';
import { asignaciones, proyectos } from '../../db/schema/proyectos.js';
import { db } from '../../db/index.js';
import type { User } from '../../db/schema/users.js';
import { createUser, findUserByEmail, findUserById, updateUserById } from '../../services/users-repository.js';
import {
  buildUserFilters,
  isPrivilegedUser,
  requireSelfOrPrivileged,
  toNumber,
} from './helpers.js';
import {
  changePasswordSchema,
  createUserSchema,
  idParamsSchema,
  listQuerySchema,
  updateUserSchema,
} from './schemas.js';

export const registerUsuariosRoutes = (router: Hono<HonoEnv>) => {
  router.use('*', authMiddleware);

  router.get('/', async (c) => {
    const query = parseQuery(c, listQuerySchema);
    const filters = buildUserFilters({
      search: query.search,
      rol: query.rol,
      departamentoId: query.departamentoId,
      managerId: query.managerId,
      activo: query.activo,
    });
    const whereClause = filters.length ? and(...filters) : undefined;

    const countBaseQuery = db.select({ count: sql<number>`count(*)` }).from(users);
    const totalResult = await (whereClause ? countBaseQuery.where(whereClause) : countBaseQuery);
    const total = Number(totalResult[0]?.count ?? 0);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const baseQuery = db
      .select({
        user: users,
        departamentoNombre: departamentos.nombre,
      })
      .from(users)
      .leftJoin(departamentos, eq(users.departamentoId, departamentos.id));
    const queryWithWhere = whereClause ? baseQuery.where(whereClause) : baseQuery;
    const list = await queryWithWhere.limit(limit).offset((page - 1) * limit);

    return c.json({
      data: list.map((row) => toUserResponse({ ...row.user, departamentoNombre: row.departamentoNombre })),
      meta: {
        page,
        limit,
        total,
      },
    });
  });

  router.post('/', requireRoles('ADMIN', 'RRHH'), async (c) => {
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

  router.get('/:id', async (c) => {
    const { id } = parseParams(c, idParamsSchema);
    const user = await findUserById(id);
    if (!user) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    return c.json(toUserResponse(user));
  });

  router.put('/:id', async (c) => {
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

  router.delete('/:id', requireRoles('ADMIN', 'RRHH'), async (c) => {
    const { id } = parseParams(c, idParamsSchema);
    const user = await findUserById(id);
    if (!user) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    await updateUserById(id, { deletedAt: new Date(), updatedAt: new Date() });
    return c.json({ message: 'Usuario desactivado' });
  });

  router.patch('/:id/password', async (c) => {
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

  router.patch('/:id/restore', requireRoles('ADMIN', 'RRHH'), async (c) => {
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

  router.patch('/:id/reset-password', requireRoles('ADMIN', 'RRHH'), async (c) => {
    const { id } = parseParams(c, idParamsSchema);
    const user = await findUserById(id);
    if (!user) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    if (user.deletedAt) {
      throw new HTTPException(400, { message: 'El usuario esta inactivo' });
    }

    // Generate a cryptographically secure temporary password
    const { randomBytes: genBytes } = await import('node:crypto');
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnpqrstuvwxyz';
    const digits = '23456789';
    const symbols = '!@#$%&*';
    const all = upper + lower + digits + symbols;
    const randomBuffer = genBytes(16);
    const chars: string[] = new Array(16);
    for (let i = 0; i < 16; i++) {
      chars[i] = all.charAt(randomBuffer[i] % all.length);
    }
    // Ensure password policy: insert required character types at random positions
    const requiredSets = [upper, lower, digits, symbols];
    const usedPositions: number[] = [];
    const posBuffer = genBytes(4);
    for (let i = 0; i < requiredSets.length; i++) {
      let pos: number;
      do {
        pos = posBuffer[i] % 16;
      } while (usedPositions.includes(pos));
      usedPositions.push(pos);
      const setChars = requiredSets[i];
      chars[pos] = setChars.charAt(genBytes(1)[0] % setChars.length);
    }
    const tempPassword = chars.join('');

    await updateUserById(user.id, {
      passwordHash: await hashPassword(tempPassword),
      passwordTemporal: true,
      mfaEnabled: false,
      mfaSecret: null,
      updatedAt: new Date(),
    });

    return c.json({
      message: 'Contraseña temporal generada. Enviar al usuario por canal seguro (email interno, Slack).',
      // ⚠️ MEJORA RECOMENDADA: No retornar tempPassword en HTTP response
      // Considerar enviar por email en vez de incluir en respuesta HTTP para evitar captura en logs.
      // El frontend actualmente depende de este campo para mostrarlo al admin en UI.
      tempPassword,
    });
  });

  router.patch('/:id/unlock', requireRoles('ADMIN'), async (c) => {
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

  router.get('/:id/proyectos', async (c) => {
    const { id } = parseParams(c, idParamsSchema);
    const rows = await db
      .select({ proyecto: proyectos })
      .from(asignaciones)
      .innerJoin(proyectos, eq(asignaciones.proyectoId, proyectos.id))
      .where(
        and(
          eq(asignaciones.usuarioId, id),
          isNull(asignaciones.deletedAt),
          isNull(proyectos.deletedAt)
        )
      );
    return c.json({ data: rows.map((row) => toProyectoResponse(row.proyecto)) });
  });

  router.get('/:id/carga', async (c) => {
    const { id } = parseParams(c, idParamsSchema);
    const rows = await db
      .select({ dedicacionPorcentaje: asignaciones.dedicacionPorcentaje })
      .from(asignaciones)
      .where(and(eq(asignaciones.usuarioId, id), isNull(asignaciones.deletedAt)));
    const dedicacionTotal = rows.reduce(
      (total, item) => total + toNumber(item.dedicacionPorcentaje, 0),
      0
    );
    return c.json({
      usuarioId: id,
      dedicacionTotal,
    });
  });
};
