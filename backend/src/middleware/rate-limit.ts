import type { MiddlewareHandler } from 'hono';

type RateLimitOptions = {
  windowMs: number;
  max: number;
  keyGenerator: (c: Parameters<MiddlewareHandler>[0]) => string | undefined;
  message?: string;
};

type RateLimitState = {
  count: number;
  resetAt: number;
};

const getClientIp = (c: Parameters<MiddlewareHandler>[0]) => {
  const forwardedFor = c.req.header('x-forwarded-for');
  return forwardedFor?.split(',')[0]?.trim() || c.req.header('x-real-ip') || 'unknown';
};

export const createRateLimiter = ({
  windowMs,
  max,
  keyGenerator,
  message,
}: RateLimitOptions): MiddlewareHandler => {
  const store = new Map<string, RateLimitState>();

  return async (c, next) => {
    const key = keyGenerator(c);
    if (!key) {
      await next();
      return;
    }

    const now = Date.now();
    const state = store.get(key);

    if (!state || state.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      state.count += 1;
    }

    const current = store.get(key);
    if (current && current.count > max) {
      const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
      c.header('Retry-After', retryAfterSeconds.toString());
      return c.json(
        { error: message ?? 'Too many requests', code: 'RATE_LIMITED' },
        429
      );
    }

    await next();
  };
};

export const getRateLimitIp = (c: Parameters<MiddlewareHandler>[0]) => getClientIp(c);
