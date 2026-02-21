import type { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { HonoEnv } from '../../../types/hono.js';
import { parseJson, parseParams } from '../../../validators/parse.js';
import { toTimetrackingResponse } from '../../../services/mappers.js';
import type { User } from '../../../db/schema/users.js';
import {
  deleteTimetrackingById,
  findTimetrackingById,
  updateTimetrackingById,
} from '../../../services/timetracking-repository.js';
import { idParamsSchema, updateRegistroSchema } from '../schemas.js';
import { assertCanWrite, getTeamMemberIds, resolveAllowedUserIds } from './auth-utils.js';

export const registerTimetrackingRecordRoutes = (router: Hono<HonoEnv>) => {
  /**
   * GET /timetracking/:id
   * - ADMIN / RRHH: pueden ver cualquier registro.
   * - MANAGER: puede ver registros de su equipo + los propios.
   * - EMPLEADO: solo los suyos.
   */
  router.get('/:id', async (c) => {
    const { id } = parseParams(c, idParamsSchema);
    const user = c.get('user') as User;
    const registro = await findTimetrackingById(id);
    if (!registro) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    const teamIds = user.rol === 'MANAGER' ? await getTeamMemberIds(user.id) : [];
    // resolveAllowedUserIds lanzará 403 si el usuario no puede leer este registro
    resolveAllowedUserIds(user, registro.usuarioId, teamIds);
    return c.json(toTimetrackingResponse(registro));
  });

  /**
   * PUT /timetracking/:id
   * - RRHH: 403 (solo lectura).
   * - ADMIN: puede editar cualquier registro.
   * - MANAGER: puede editar registros de su equipo + los propios.
   * - EMPLEADO: solo los suyos y solo si están en estado PENDIENTE.
   */
  router.put('/:id', async (c) => {
    const { id } = parseParams(c, idParamsSchema);
    const payload = await parseJson(c, updateRegistroSchema);
    const user = c.get('user') as User;
    const registro = await findTimetrackingById(id);
    if (!registro) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    const teamIds = user.rol === 'MANAGER' ? await getTeamMemberIds(user.id) : [];
    assertCanWrite(user, registro.usuarioId, teamIds);

    // EMPLEADO solo puede editar registros PENDIENTES
    if (user.rol === 'EMPLEADO' && registro.estado !== 'PENDIENTE') {
      throw new HTTPException(403, { message: 'Solo puedes editar registros pendientes de aprobación' });
    }

    const { horas, ...rest } = payload;
    const updated = await updateTimetrackingById(id, {
      ...rest,
      horas: horas?.toString(),
      updatedAt: new Date(),
    });
    if (!updated) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }

    return c.json(toTimetrackingResponse(updated));
  });

  /**
   * DELETE /timetracking/:id
   * - RRHH: 403 (solo lectura).
   * - ADMIN: puede eliminar cualquier registro.
   * - MANAGER: puede eliminar registros de su equipo + los propios.
   * - EMPLEADO: solo los suyos y solo si están en estado PENDIENTE.
   */
  router.delete('/:id', async (c) => {
    const { id } = parseParams(c, idParamsSchema);
    const user = c.get('user') as User;
    const registro = await findTimetrackingById(id);
    if (!registro) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    const teamIds = user.rol === 'MANAGER' ? await getTeamMemberIds(user.id) : [];
    assertCanWrite(user, registro.usuarioId, teamIds);

    // EMPLEADO solo puede eliminar registros PENDIENTES
    if (user.rol === 'EMPLEADO' && registro.estado !== 'PENDIENTE') {
      throw new HTTPException(403, { message: 'Solo puedes eliminar registros pendientes de aprobación' });
    }

    await deleteTimetrackingById(id);
    return c.json({ message: 'Registro eliminado' });
  });
};

