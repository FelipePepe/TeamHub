import type { MiddlewareHandler } from 'hono';

type RateLimitOptions = {
  windowMs: number;
  max: number;
  keyGenerator: (c: Parameters<MiddlewareHandler>[0]) => string | undefined;
  message?: string;
  skipSuccessfulRequests?: boolean;
};

type RateLimitState = {
  count: number;
  resetAt: number;
};

const getClientIp = (c: Parameters<MiddlewareHandler>[0]) => {
  const forwardedFor = c.req.header('x-forwarded-for');
  return forwardedFor?.split(',')[0]?.trim() || c.req.header('x-real-ip') || 'unknown';
};

/**
 * Rate Limiter con limpieza automática de memoria
 * 
 * Características:
 * - Limita requests por IP o por usuario autenticado
 * - Limpieza automática de entradas expiradas cada 10 minutos
 * - Respeta el estándar Retry-After header
 * - Opción de no contar requests exitosos
 * 
 * @param options Configuración del rate limiter
 * @returns Middleware de Hono
 */
export const createRateLimiter = ({
  windowMs,
  max,
  keyGenerator,
  message,
  skipSuccessfulRequests = false,
}: RateLimitOptions): MiddlewareHandler => {
  const store = new Map<string, RateLimitState>();
  let cleanupIntervalId: NodeJS.Timeout | null = null;

  // Limpieza automática de entradas expiradas cada 10 minutos
  if (!cleanupIntervalId) {
    cleanupIntervalId = setInterval(() => {
      const now = Date.now();
      for (const [key, state] of store.entries()) {
        if (state.resetAt <= now) {
          store.delete(key);
        }
      }
    }, 10 * 60 * 1000); // 10 minutos

    // Evitar memory leak en tests con múltiples instancias
    if (cleanupIntervalId.unref) {
      cleanupIntervalId.unref();
    }
  }

  // Limpieza al finalizar el proceso
  const cleanup = () => {
    if (cleanupIntervalId) {
      clearInterval(cleanupIntervalId);
      cleanupIntervalId = null;
    }
  };

  if (typeof process !== 'undefined') {
    // Limitar listeners para evitar warning en tests
    const currentLimit = process.getMaxListeners();
    if (currentLimit < 20) {
      process.setMaxListeners(20);
    }
    
    process.once('SIGTERM', cleanup);
    process.once('SIGINT', cleanup);
  }

  return async (c, next) => {
    const key = keyGenerator(c);
    if (!key) {
      await next();
      return;
    }

    const now = Date.now();
    const state = store.get(key);

    // Inicializar o resetear contador si expiró
    if (!state || state.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      state.count += 1;
    }

    const current = store.get(key);
    
    // Verificar si excedió el límite
    if (current && current.count > max) {
      const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
      c.header('Retry-After', retryAfterSeconds.toString());
      c.header('X-RateLimit-Limit', max.toString());
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', new Date(current.resetAt).toISOString());
      
      return c.json(
        { 
          error: message ?? 'Too many requests', 
          code: 'RATE_LIMITED',
          retryAfter: retryAfterSeconds 
        },
        429
      );
    }

    await next();

    // Decrementar contador si la request fue exitosa y está configurado para hacerlo
    if (skipSuccessfulRequests && c.res.status < 400 && current) {
      current.count = Math.max(0, current.count - 1);
    }

    // Añadir headers informativos en response exitoso
    if (current) {
      c.header('X-RateLimit-Limit', max.toString());
      c.header('X-RateLimit-Remaining', Math.max(0, max - current.count).toString());
      c.header('X-RateLimit-Reset', new Date(current.resetAt).toISOString());
    }
  };
};

export const getRateLimitIp = (c: Parameters<MiddlewareHandler>[0]) => getClientIp(c);
