import { HTTPException } from 'hono/http-exception';
import { eq, ilike, isNotNull, isNull, or } from 'drizzle-orm';
import { z } from 'zod';
import type { User } from '../../db/schema/users.js';
import { users } from '../../db/schema/users.js';
import { listQuerySchema } from './schemas.js';

export const toNumber = (value: unknown, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const PRIVILEGED_ROLES: User['rol'][] = ['ADMIN', 'RRHH'];

export const isPrivilegedUser = (user: User) => PRIVILEGED_ROLES.includes(user.rol);

export const requireSelfOrPrivileged = (currentUser: User, targetId: string) => {
  if (currentUser.id !== targetId && !isPrivilegedUser(currentUser)) {
    throw new HTTPException(403, { message: 'Acceso denegado' });
  }
};

export const buildUserFilters = (query: z.infer<typeof listQuerySchema>) => {
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
  if (query.managerId) {
    filters.push(eq(users.managerId, query.managerId));
  }
  if (query.activo !== undefined) {
    filters.push(query.activo ? isNull(users.deletedAt) : isNotNull(users.deletedAt));
  }
  return filters;
};
