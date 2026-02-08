import { HTTPException } from 'hono/http-exception';
import type { MiddlewareHandler } from 'hono';
import { verifyAccessToken } from '../services/auth-service.js';
import type { User } from '../db/schema/users.js';
import { findActiveUserById } from '../services/users-repository.js';

/**
 * Middleware de autenticación JWT.
 * Verifica el token Bearer, busca el usuario activo en DB y lo inyecta en el contexto.
 * Diferencia errores de autenticación (401) de errores internos como fallos de DB (500)
 * para evitar que timeouts de conexión se enmascaren como tokens inválidos.
 * @throws {HTTPException} 401 si el token es inválido o el usuario no existe
 * @throws {HTTPException} 500 si hay un error interno (ej: DB no disponible)
 */
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
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    throw new HTTPException(500, { message: 'Error interno del servidor' });
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
