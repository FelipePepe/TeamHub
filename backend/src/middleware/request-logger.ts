import type { Context, Next } from 'hono';
import { logRequestCompleted } from '../services/logger.js';

const MAX_RESPONSE_LOG_CHARS = 8_000;

function getUserInfo(value: unknown): { userId?: string; userEmail?: string } {
  if (!value || typeof value !== 'object') return {};
  const maybeId = (value as { id?: unknown }).id;
  const maybeEmail = (value as { email?: unknown }).email;
  return {
    userId: typeof maybeId === 'string' ? maybeId : undefined,
    userEmail: typeof maybeEmail === 'string' ? maybeEmail : undefined,
  };
}

function shouldLogResponseBody(path: string): boolean {
  // Avoid logging potentially sensitive auth payloads even in dev.
  if (!path.startsWith('/api/')) return false;
  if (path.startsWith('/api/auth/')) return false;
  if (path.startsWith('/api/mfa/')) return false;
  return true;
}

async function getResponseBodyPreview(res: unknown): Promise<string | undefined> {
  // In production, Hono sets c.res as a Response. Tests may mock it differently.
  if (!(res instanceof Response)) return undefined;

  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const isText = contentType.startsWith('text/');
  if (!isJson && !isText) return undefined;

  try {
    const text = await res.clone().text();
    if (text.length <= MAX_RESPONSE_LOG_CHARS) return text;
    return `${text.slice(0, MAX_RESPONSE_LOG_CHARS)}... [truncated]`;
  } catch {
    return undefined;
  }
}

/**
 * Middleware que registra peticiones con latencia y estado (según configuración de logging).
 * @param c - Contexto de Hono.
 * @param next - Continuación de la cadena de middlewares.
 */
export async function requestLogger(c: Context, next: Next) {
  const startedAt = Date.now();
  try {
    await next();
  } finally {
    const durationMs = Date.now() - startedAt;
    const status = c.res?.status ?? 500;
    let query: string | undefined;
    try {
      const url = new URL(c.req.url);
      query = url.search ? url.search.slice(1) : undefined;
    } catch {
      query = undefined;
    }
    const { userId, userEmail } = getUserInfo(c.get('user'));
    const responseBody = shouldLogResponseBody(c.req.path)
      ? await getResponseBodyPreview(c.res)
      : undefined;
    logRequestCompleted({
      method: c.req.method,
      path: c.req.path,
      query,
      status,
      durationMs,
      userId,
      userEmail,
      responseBody,
    });
  }
}
