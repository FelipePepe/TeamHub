import type { Context } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { randomBytes } from 'node:crypto';
import { config } from '../config/env.js';

/**
 * Cookie names para tokens de autenticación
 */
export const COOKIE_ACCESS_TOKEN = 'access_token';
export const COOKIE_REFRESH_TOKEN = 'refresh_token';
export const COOKIE_CSRF_TOKEN = 'csrf_token';

/**
 * Opciones de cookies seguras para producción
 */
const getCookieOptions = (maxAge?: number) => ({
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'Strict' as const,
  path: '/',
  maxAge,
});

/**
 * Establece tokens de autenticación como cookies httpOnly seguras.
 * @param c - Contexto de Hono
 * @param accessToken - JWT access token (15 minutos)
 * @param refreshToken - JWT refresh token (30 días)
 */
export const setAuthCookies = (
  c: Context,
  accessToken: string,
  refreshToken: string
): void => {
  // Access token: 15 minutos
  setCookie(c, COOKIE_ACCESS_TOKEN, accessToken, {
    ...getCookieOptions(15 * 60), // 15 min en segundos
  });

  // Refresh token: 30 días
  setCookie(c, COOKIE_REFRESH_TOKEN, refreshToken, {
    ...getCookieOptions(30 * 24 * 60 * 60), // 30 días en segundos
  });
};

/**
 * Elimina cookies de autenticación (logout).
 * @param c - Contexto de Hono
 */
export const clearAuthCookies = (c: Context): void => {
  deleteCookie(c, COOKIE_ACCESS_TOKEN, { path: '/' });
  deleteCookie(c, COOKIE_REFRESH_TOKEN, { path: '/' });
  deleteCookie(c, COOKIE_CSRF_TOKEN, { path: '/' });
};

/**
 * Genera y establece token CSRF en cookie.
 * @param c - Contexto de Hono
 * @returns Token CSRF generado
 */
export const setCsrfToken = (c: Context): string => {
  const csrfToken = randomBytes(32).toString('hex');
  
  setCookie(c, COOKIE_CSRF_TOKEN, csrfToken, {
    httpOnly: false, // CSRF token debe ser accesible por JS
    secure: config.NODE_ENV === 'production',
    sameSite: 'Strict' as const,
    path: '/',
    maxAge: 15 * 60, // 15 minutos
  });

  return csrfToken;
};
