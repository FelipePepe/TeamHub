/**
 * Sentry Integration
 * Configuración para enviar errores a Sentry
 */

import * as Sentry from '@sentry/node';

interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
}

let sentryInitialized = false;

/**
 * Inicializa Sentry con la configuración proporcionada
 */
export function initSentry(config: SentryConfig): void {
  if (sentryInitialized) {
    console.warn('Sentry already initialized');
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    tracesSampleRate: config.tracesSampleRate,
    
    // Integrations
    integrations: [
      Sentry.httpIntegration(),
    ],
  });

  sentryInitialized = true;
  console.log(`[Sentry] Initialized for ${config.environment}`);
}

/**
 * Captura una excepción y la envía a Sentry
 */
export function captureException(
  error: unknown,
  contexto?: Record<string, unknown>
): string | undefined {
  if (!sentryInitialized) {
    return undefined;
  }

  if (contexto) {
    Sentry.setContext('additional', contexto);
  }
  
  return Sentry.captureException(error);
}

/**
 * Captura un mensaje y lo envía a Sentry
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' | 'fatal' = 'info'
): string | undefined {
  if (!sentryInitialized) {
    return undefined;
  }

  return Sentry.captureMessage(message, level);
}

/**
 * Añade contexto de usuario a Sentry
 */
export function setUserContext(user: { id: string; email?: string; username?: string }): void {
  if (!sentryInitialized) {
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}
