/**
 * Helper para establecer el contexto de auditoría en PostgreSQL.
 * Debe llamarse al inicio de cada transacción para que los triggers
 * de auditoría registren el usuario que realiza la operación.
 */
import { pool } from './index.js';
import type { PoolClient } from 'pg';

export interface AuditContext {
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Establece el contexto de auditoría para la sesión actual.
 * Debe usarse con un cliente de transacción.
 */
export async function setAuditContext(
  client: PoolClient,
  context: AuditContext
): Promise<void> {
  const { userId, userEmail, ipAddress, userAgent } = context;

  // Establecer variables de sesión local (solo para esta transacción)
  if (userId) {
    await client.query(`SET LOCAL app.current_user_id = '${userId}'`);
  }
  if (userEmail) {
    await client.query(
      `SET LOCAL app.current_user_email = '${userEmail.replace(/'/g, "''")}'`
    );
  }
  if (ipAddress) {
    await client.query(`SET LOCAL app.client_ip = '${ipAddress}'`);
  }
  if (userAgent) {
    await client.query(
      `SET LOCAL app.user_agent = '${userAgent.replace(/'/g, "''").substring(0, 500)}'`
    );
  }
}

/**
 * Ejecuta una función dentro de una transacción con contexto de auditoría.
 */
export async function withAuditContext<T>(
  context: AuditContext,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await setAuditContext(client, context);

    const result = await fn(client);

    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Helper para extraer contexto de auditoría desde un request de Hono.
 */
export function extractAuditContextFromRequest(c: {
  req: {
    header: (name: string) => string | undefined;
  };
  get?: (key: string) => unknown;
}): AuditContext {
  // Obtener usuario del contexto (establecido por middleware de auth)
  const user = c.get?.('user') as { id?: string; email?: string } | undefined;

  // Obtener IP del cliente
  const forwardedFor = c.req.header('x-forwarded-for');
  const ipAddress = forwardedFor?.split(',')[0]?.trim() || c.req.header('x-real-ip');

  // Obtener User-Agent
  const userAgent = c.req.header('user-agent');

  return {
    userId: user?.id,
    userEmail: user?.email,
    ipAddress,
    userAgent,
  };
}
