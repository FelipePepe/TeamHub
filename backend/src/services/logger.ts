import pino from 'pino';
import { config } from '../config/env.js';

const isHostedPlatform = Boolean(config.VERCEL || config.RENDER);

export const isDebugLoggingEnabled =
  config.LOG_LEVEL === 'debug' && config.NODE_ENV !== 'production' && !isHostedPlatform;

export const logger = pino({
  level: config.LOG_LEVEL,
});

/**
 * Registra errores de request con contexto adicional.
 * @param err - Error capturado durante el request.
 * @param context - Contexto adicional del request.
 */
export const logRequestError = (err: Error, context: Record<string, unknown>) => {
  logger.error({ err, ...context }, 'Request failed');
};

/**
 * Registra logs de depuración solo cuando el modo debug está habilitado.
 * @param message - Mensaje de log.
 * @param context - Contexto adicional del log.
 */
export const logDebug = (message: string, context: Record<string, unknown> = {}) => {
  if (!isDebugLoggingEnabled) return;
  logger.debug(context, message);
};
