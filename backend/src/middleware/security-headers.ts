import type { MiddlewareHandler } from 'hono';
import { config } from '../config/env';

const cspDirectives = [
  "default-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');
const swaggerCspDirectives = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const isSwaggerPath = (path: string) => path === '/docs' || path.startsWith('/docs/');

export const securityHeaders: MiddlewareHandler = async (c, next) => {
  await next();

  c.header('X-Frame-Options', 'DENY');
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'no-referrer');
  const csp = isSwaggerPath(c.req.path) ? swaggerCspDirectives : cspDirectives;
  c.header('Content-Security-Policy', csp);

  if (config.NODE_ENV === 'production') {
    c.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
};
