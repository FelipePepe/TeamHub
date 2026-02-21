import { HTTPException } from 'hono/http-exception';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { users } from '../../../db/schema/users.js';
import type { User } from '../../../db/schema/users.js';

/**
 * Roles que pueden leer registros de cualquier usuario.
 */
const READ_ALL_ROLES: User['rol'][] = ['ADMIN', 'RRHH'];

/**
 * Obtiene los IDs de los miembros del equipo de un manager.
 * @param managerId - ID del manager.
 * @returns Array de IDs de usuarios cuyo managerId coincide.
 */
export async function getTeamMemberIds(managerId: string): Promise<string[]> {
  const members = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.managerId, managerId), isNull(users.deletedAt)));
  return members.map((m) => m.id);
}

/**
 * Devuelve el conjunto de IDs de usuario que el solicitante puede leer.
 *
 * - ADMIN / RRHH: sin restricción por usuario → devuelve `'ALL'`.
 *   Si se pasa un `requestedUserId` concreto, devuelve ese ID directamente.
 * - MANAGER: puede ver a sí mismo y a su equipo.
 *   Si se pasa un `requestedUserId` no permitido lanza 403.
 * - EMPLEADO: solo a sí mismo.
 *   Si se pasa un `requestedUserId` diferente lanza 403.
 *
 * @param requestingUser - Usuario autenticado.
 * @param requestedUserId - Filtro explícito de usuario (query param).
 * @param teamIds - IDs del equipo del manager (solo relevante si es MANAGER).
 * @returns `'ALL'` para acceso sin restricción o array de IDs permitidos.
 * @throws HTTPException 403 si el usuario no tiene acceso al recurso solicitado.
 */
export function resolveAllowedUserIds(
  requestingUser: User,
  requestedUserId: string | undefined,
  teamIds: string[]
): 'ALL' | string[] {
  if (READ_ALL_ROLES.includes(requestingUser.rol)) {
    return requestedUserId ? [requestedUserId] : 'ALL';
  }

  if (requestingUser.rol === 'MANAGER') {
    const allowed = [requestingUser.id, ...teamIds];
    if (requestedUserId) {
      if (!allowed.includes(requestedUserId)) {
        throw new HTTPException(403, { message: 'No autorizado para ver registros de este usuario' });
      }
      return [requestedUserId];
    }
    return allowed;
  }

  // EMPLEADO
  if (requestedUserId && requestedUserId !== requestingUser.id) {
    throw new HTTPException(403, { message: 'Solo puedes consultar tus propios registros' });
  }
  return [requestingUser.id];
}

/**
 * Verifica que el usuario autenticado pueda CREAR registros para `targetUserId`.
 *
 * - ADMIN: puede crear para cualquiera.
 * - RRHH: solo lectura → siempre lanza 403.
 * - MANAGER: puede crear para sí mismo y su equipo.
 * - EMPLEADO: solo para sí mismo.
 *
 * @throws HTTPException 403 si no tiene permiso.
 */
export function assertCanWrite(
  requestingUser: User,
  targetUserId: string,
  teamIds: string[]
): void {
  if (requestingUser.rol === 'RRHH') {
    throw new HTTPException(403, {
      message: 'RRHH solo tiene acceso de lectura a los registros de tiempo',
    });
  }

  if (requestingUser.rol === 'ADMIN') return;

  if (requestingUser.rol === 'MANAGER') {
    const allowed = [requestingUser.id, ...teamIds];
    if (!allowed.includes(targetUserId)) {
      throw new HTTPException(403, { message: 'Solo puedes gestionar registros de tu equipo' });
    }
    return;
  }

  // EMPLEADO
  if (targetUserId !== requestingUser.id) {
    throw new HTTPException(403, { message: 'Solo puedes gestionar tus propios registros' });
  }
}
