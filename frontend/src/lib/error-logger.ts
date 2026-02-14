/**
 * Frontend Error Logger
 * Hook y funciones para capturar y registrar errores del frontend
 */

interface LogFrontendErrorParams {
  mensaje: string;
  stackTrace?: string;
  contexto?: {
    url?: string;
    route?: string;
    component?: string;
    userAction?: string;
    viewport?: { width: number; height: number };
    [key: string]: unknown;
  };
  nivel?: 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
}

/**
 * Registra un error del frontend en el backend
 * @param params Parámetros del error
 */
export async function logFrontendError(params: LogFrontendErrorParams): Promise<void> {
  try {
    const response = await fetch('/api/errors/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origen: 'FRONTEND',
        nivel: params.nivel || 'ERROR',
        mensaje: params.mensaje,
        stackTrace: params.stackTrace,
        contexto: {
          ...params.contexto,
          url: window.location.href,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          userAgent: navigator.userAgent,
        },
      }),
    });

    if (!response.ok) {
      console.error('Failed to log error to backend');
    }
  } catch (error) {
    // Si falla el logging, solo logueamos en consola
    console.error('Error logging to backend:', error);
  }
}

/**
 * Extrae información útil de un error
 */
export function extractErrorInfo(error: unknown): {
  mensaje: string;
  stackTrace?: string;
} {
  if (error instanceof Error) {
    return {
      mensaje: error.message,
      stackTrace: error.stack,
    };
  }

  if (typeof error === 'string') {
    return { mensaje: error };
  }

  return { mensaje: 'Unknown error' };
}

/**
 * Formatea un mensaje de error para mostrar al usuario
 * Nunca muestra stack traces ni detalles técnicos
 */
export function getUserFriendlyMessage(error: unknown): string {
  const defaultMessage = 'Ha ocurrido un error. Por favor, inténtalo de nuevo.';

  if (error instanceof Error) {
    // Mapear errores conocidos
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return 'Error de conexión. Por favor, verifica tu conexión a internet.';
    }
    if (error.message.includes('timeout')) {
      return 'La operación tardó demasiado. Por favor, inténtalo de nuevo.';
    }
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
    }
    if (error.message.includes('403') || error.message.includes('forbidden')) {
      return 'No tienes permisos para realizar esta acción.';
    }
    if (error.message.includes('404')) {
      return 'El recurso solicitado no existe.';
    }
    if (error.message.includes('500')) {
      return 'Error del servidor. Nuestro equipo ha sido notificado.';
    }
  }

  return defaultMessage;
}

/**
 * Global error handler para React
 * Captura errores no manejados y los registra
 */
export function setupGlobalErrorHandling(): void {
  // Capturar errores de JavaScript
  window.addEventListener('error', (event) => {
    const { mensaje, stackTrace } = extractErrorInfo(event.error);
    logFrontendError({
      mensaje,
      stackTrace,
      nivel: 'ERROR',
      contexto: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // Capturar promesas rechazadas
  window.addEventListener('unhandledrejection', (event) => {
    const { mensaje, stackTrace } = extractErrorInfo(event.reason);
    logFrontendError({
      mensaje,
      stackTrace,
      nivel: 'ERROR',
      contexto: {
        type: 'unhandledRejection',
      },
    });
  });
}
