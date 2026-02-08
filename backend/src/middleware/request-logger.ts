import type { Context, Next } from 'hono';
import { logDebug } from '../services/logger.js';

/**
 * Middleware que registra peticiones en modo debug con latencia y estado.
 * @param c - Contexto de Hono.
 * @param next - Continuación de la cadena de middlewares.
 */
export async function requestLogger(c: Context, next: Next) {
  const startedAt = Date.now();
  try {
    await next();
  } finally {
    const durationMs = Date.now() - startedAt;
    const status = c.res?.status ?? 500;
    logDebug('Request completed', {
      method: c.req.method,
      path: c.req.path,
      status,
      durationMs,
    });
  }
}
