import { HTTPException } from 'hono/http-exception';
import type { MiddlewareHandler } from 'hono';
import { verifyAccessToken } from '../services/auth-service';
import type { User } from '../db/schema/users';
import { findActiveUserById } from '../services/users-repository';

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'No autorizado' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  try {
    const payload = verifyAccessToken(token);
    const user = await findActiveUserById(payload.sub);
    if (!user) {
      throw new HTTPException(401, { message: 'No autorizado' });
    }
    c.set('user', user as User);
  } catch {
    throw new HTTPException(401, { message: 'No autorizado' });
  }

  await next();
};

export const requireRoles = (...roles: User['rol'][]): MiddlewareHandler => async (c, next) => {
  const user = c.get('user') as User | undefined;
  if (!user || !roles.includes(user.rol)) {
    throw new HTTPException(403, { message: 'Acceso denegado' });
  }
  await next();
};
