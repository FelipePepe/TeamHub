/**
 * Global Error Logger Middleware
 * Captura y registra errores en la base de datos (sin modificar la respuesta)
 */

import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { HonoEnv } from '../types/hono.js';
import { extractErrorInfo, logError } from '../services/error-logger.js';
import { ZodError } from 'zod';

/**
 * Middleware para registrar errores en la base de datos
 * No modifica el flujo de error handling existente
 */
export async function errorLoggerMiddleware(c: Context<HonoEnv>, next: Next) {
  try {
    await next();
  } catch (error) {
    // Extraer información del usuario autenticado (si existe)
    const user = c.get('user');
    const userId = user?.id;

    // Extraer información de la request
    const method = c.req.method;
    const url = c.req.url;
    const userAgent = c.req.header('user-agent');
    const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip');

    // Extraer información del error
    const { mensaje, stackTrace } = extractErrorInfo(error);

    // Determinar nivel de error
    let nivel: 'INFO' | 'WARN' | 'ERROR' | 'FATAL' = 'ERROR';

    if (error instanceof HTTPException) {
      const statusCode = error.status;
      if (statusCode >= 500) nivel = 'ERROR';
      else if (statusCode >= 400) nivel = 'WARN';
      else nivel = 'INFO';
    } else if (error instanceof ZodError) {
      nivel = 'WARN';
    } else {
      nivel = 'FATAL';
    }

    // Contexto completo para debugging
    const contexto = {
      endpoint: url,
      method,
      params: c.req.param(),
      query: Object.fromEntries(new URL(url).searchParams),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    };

    // Registrar en base de datos (async, no bloqueante)
    logError({
      userId,
      origen: 'BACKEND',
      nivel,
      mensaje,
      stackTrace,
      contexto,
      userAgent,
      ipAddress,
    }).catch((logErr) => {
      // Si falla el logging, solo logueamos en consola
      console.error('Failed to log error to database:', logErr);
    });

    // Enviar a Sentry
    const { captureException } = await import('../services/sentry.js');
    captureException(error, contexto);

    // Re-lanzar el error para que el error handler existente lo procese
    throw error;
  }
}
