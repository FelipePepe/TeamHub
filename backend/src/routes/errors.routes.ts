/**
 * Errors API Routes
 * Endpoint para que el frontend registre errores
 */

import type { Hono } from 'hono';
import type { HonoEnv } from '../types/hono.js';
import { logError } from '../services/error-logger.js';
import { z } from 'zod';
import { parseJson } from '../validators/parse.js';

const logErrorSchema = z.object({
  origen: z.enum(['FRONTEND', 'BACKEND']),
  nivel: z.enum(['INFO', 'WARN', 'ERROR', 'FATAL']),
  mensaje: z.string(),
  stackTrace: z.string().optional(),
  contexto: z.record(z.unknown()).optional(),
});

export function registerErrorRoutes(router: Hono<HonoEnv>) {
  /**
   * POST /errors/log
   * Registra un error del frontend
   */
  router.post('/log', async (c) => {
    const payload = await parseJson(c, logErrorSchema);
    const user = c.get('user');

    // Extraer información de la request
    const userAgent = c.req.header('user-agent');
    const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip');

    // Registrar el error
    const errorId = await logError({
      userId: user?.id,
      origen: payload.origen,
      nivel: payload.nivel,
      mensaje: payload.mensaje,
      stackTrace: payload.stackTrace,
      contexto: payload.contexto,
      userAgent,
      ipAddress,
    });

    return c.json({ id: errorId, message: 'Error registrado correctamente' }, 201);
  });
}
