/**
 * Error Logger Service
 * Registra errores en PostgreSQL y opcionalmente en Sentry
 */

import { db } from '../db/index.js';
import { errorLogs } from '../db/schema/error-logs.js';
import type { ErrorLevel, ErrorOrigin } from '../db/schema/error-logs.js';

interface LogErrorParams {
  userId?: string;
  origen: ErrorOrigin;
  nivel: ErrorLevel;
  mensaje: string;
  stackTrace?: string;
  contexto?: Record<string, unknown>;
  userAgent?: string;
  ipAddress?: string;
  sentryEventId?: string;
}

/**
 * Registra un error en la base de datos
 * @param params Parámetros del error a registrar
 * @returns ID del error registrado
 */
export async function logError(params: LogErrorParams): Promise<string> {
  try {
    const [errorLog] = await db
      .insert(errorLogs)
      .values({
        userId: params.userId,
        origen: params.origen,
        nivel: params.nivel,
        mensaje: params.mensaje,
        stackTrace: params.stackTrace,
        contexto: params.contexto,
        userAgent: params.userAgent,
        ipAddress: params.ipAddress,
        sentryEventId: params.sentryEventId,
      })
      .returning({ id: errorLogs.id });

    return errorLog.id;
  } catch (error) {
    // Si falla el logging, logueamos en consola pero no bloqueamos la app
    console.error('Error logging to database:', error);
    return '';
  }
}

/**
 * Extrae información útil de un error
 * @param error Error a analizar
 * @returns Objeto con mensaje y stack trace
 */
export function extractErrorInfo(error: unknown): {
  mensaje: string;
  stackTrace?: string;
} {
  if (error instanceof Error) {
    return {
      mensaje: error.message,
      stackTrace: error.stack ?? undefined,
    };
  }

  if (typeof error === 'string') {
    return { mensaje: error };
  }

  return { mensaje: 'Unknown error' };
}

/**
 * Formatea un mensaje de error para el usuario (sin detalles técnicos)
 * @param error Error original
 * @returns Mensaje user-friendly
 */
export function getUserFriendlyMessage(error: unknown): string {
  // Nunca mostrar stack traces, SQL errors, null pointers, etc.
  const defaultMessage = 'Ha ocurrido un error. Por favor, inténtalo de nuevo.';

  if (error instanceof Error) {
    // Mapear errores conocidos a mensajes amigables
    if (error.message.includes('duplicate key')) {
      return 'Este registro ya existe en el sistema.';
    }
    if (error.message.includes('foreign key')) {
      return 'No se puede realizar esta acción porque hay datos relacionados.';
    }
    if (error.message.includes('not found')) {
      return 'El recurso solicitado no existe.';
    }
    if (error.message.includes('unauthorized')) {
      return 'No tienes permisos para realizar esta acción.';
    }
    if (error.message.includes('validation')) {
      return 'Por favor, verifica que todos los campos estén correctos.';
    }
  }

  return defaultMessage;
}
