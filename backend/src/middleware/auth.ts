import { HTTPException } from 'hono/http-exception';
import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyAccessToken } from '../services/auth-service.js';
import type { User } from '../db/schema/users.js';
import { findActiveUserById } from '../services/users-repository.js';
import { COOKIE_ACCESS_TOKEN } from './cookies.js';

/**
 * Middleware de autenticación JWT.
 * Lee el token desde httpOnly cookie (preferido) o header Authorization (fallback para tests/APIs externas).
 * Verifica el token, busca el usuario activo en DB y lo inyecta en el contexto.
 * @throws {HTTPException} 401 si el token es inválido o el usuario no existe
 * @throws {HTTPException} 500 si hay un error interno (ej: DB no disponible)
 */
export const authMiddleware: MiddlewareHandler = async (c, next) => {
  // Intentar leer token desde cookie (httpOnly)
  let token = getCookie(c, COOKIE_ACCESS_TOKEN);
  
  // Fallback: leer desde header Authorization (para tests y APIs externas)
  if (!token) {
    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '').trim();
    }
  }

  if (!token) {
    throw new HTTPException(401, { message: 'No autorizado' });
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await findActiveUserById(payload.sub);
    if (!user) {
      throw new HTTPException(401, { message: 'No autorizado' });
    }
    c.set('user', user as User);
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    // Token inválido/expirado también devuelve 401 (no 500)
    throw new HTTPException(401, { message: 'No autorizado' });
  }

  await next();
};

/**
 * Middleware factory de autorización basado en roles RBAC.
 * @param roles - Roles permitidos para acceder al endpoint
 * @throws {HTTPException} 403 si el usuario no tiene uno de los roles requeridos
 */
export const requireRoles = (...roles: User['rol'][]): MiddlewareHandler => async (c, next) => {
  const user = c.get('user') as User | undefined;
  if (!user || !roles.includes(user.rol)) {
    throw new HTTPException(403, { message: 'Acceso denegado' });
  }
  await next();
};
