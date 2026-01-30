import type { MiddlewareHandler } from 'hono';
import { config } from '../config/env.js';

// CSP restrictivo para API endpoints (máxima seguridad)
const apiCspDirectives = [
  "default-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

// CSP más permisivo para Swagger UI (necesita scripts/estilos inline)
const swaggerCspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'", // Swagger UI necesita inline scripts
  "style-src 'self' 'unsafe-inline'",  // Swagger UI necesita inline styles
  "img-src 'self' data: https:",        // Logos y favicons
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "media-src 'none'",
  "worker-src 'none'",
  "manifest-src 'none'",
].join('; ');

const isSwaggerPath = (path: string) => path === '/docs' || path.startsWith('/docs/');

/**
 * Security Headers Middleware
 * 
 * Aplica headers de seguridad según OWASP recommendations:
 * - CSP (Content Security Policy): Previene XSS
 * - X-Frame-Options: Previene clickjacking
 * - X-Content-Type-Options: Previene MIME sniffing
 * - Referrer-Policy: Controla información de referrer
 * - HSTS: Fuerza HTTPS en producción
 * - Permissions-Policy: Deshabilita features innecesarias
 * 
 * @see https://owasp.org/www-project-secure-headers/
 */
export const securityHeaders: MiddlewareHandler = async (c, next) => {
  await next();

  // Previene clickjacking
  c.header('X-Frame-Options', 'DENY');
  
  // Previene MIME type sniffing
  c.header('X-Content-Type-Options', 'nosniff');
  
  // No enviar referrer a sitios externos
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CSP adaptado al contexto (API vs Swagger)
  const csp = isSwaggerPath(c.req.path) ? swaggerCspDirectives : apiCspDirectives;
  c.header('Content-Security-Policy', csp);

  // HSTS solo en producción (fuerza HTTPS por 2 años)
  if (config.NODE_ENV === 'production') {
    c.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  // Permissions Policy: deshabilita features del navegador que no necesitamos
  c.header('Permissions-Policy', [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()', // Deshabilita FLoC de Google
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
  ].join(', '));

  // X-XSS-Protection: header legacy pero aún útil para navegadores antiguos
  c.header('X-XSS-Protection', '1; mode=block');

  // X-DNS-Prefetch-Control: deshabilita DNS prefetching
  c.header('X-DNS-Prefetch-Control', 'off');

  // X-Download-Options: IE-specific, previene descargas automáticas
  c.header('X-Download-Options', 'noopen');
};
