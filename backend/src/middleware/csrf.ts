/**
 * CSRF Protection Middleware
 * 
 * Protege contra ataques CSRF validando que el token CSRF en cookie
 * coincida con el token enviado en el header X-CSRF-Token.
 * 
 * - Métodos seguros (GET, HEAD, OPTIONS) se permiten sin validación
 * - Endpoints de autenticación inicial (/auth/login, /auth/refresh) se excluyen
 *   porque no tienen acceso a un token CSRF previo
 * - Todos los demás requests requieren token CSRF válido
 * 
 * Refs: OWASP CSRF Prevention Cheat Sheet, ADR-067
 */

import { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { getCookie } from 'hono/cookie';
import { COOKIE_CSRF_TOKEN } from './cookies.js';

/**
 * Middleware que valida tokens CSRF para prevenir ataques CSRF.
 * 
 * @throws {HTTPException} 403 si el token CSRF es inválido o falta
 */
export const csrfMiddleware: MiddlewareHandler = async (c, next) => {
  const method = c.req.method.toUpperCase();
  const path = c.req.path;

  // Métodos seguros (idempotentes) no requieren CSRF
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(method)) {
    return await next();
  }

  // Endpoints que no requieren CSRF (no tienen token previo)
  const excludedPaths = [
    '/api/auth/login',
    '/api/auth/refresh',
    '/api/auth/mfa/setup',
    '/api/auth/mfa/verify',
  ];
  if (excludedPaths.includes(path)) {
    return await next();
  }

  // Validar que el token CSRF en cookie coincida con el header
  const cookieCsrf = getCookie(c, COOKIE_CSRF_TOKEN);
  const headerCsrf = c.req.header('X-CSRF-Token');

  if (!cookieCsrf) {
    throw new HTTPException(403, { 
      message: 'CSRF token no encontrado en cookies',
    });
  }

  if (!headerCsrf) {
    throw new HTTPException(403, { 
      message: 'CSRF token no encontrado en header X-CSRF-Token',
    });
  }

  if (cookieCsrf !== headerCsrf) {
    throw new HTTPException(403, { 
      message: 'CSRF token inválido',
    });
  }

  await next();
};
