import type { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { HonoEnv } from '../../../types/hono.js';
import type { User } from '../../../db/schema/users.js';
import { parseJson, parseParams } from '../../../validators/parse.js';
import { toTimetrackingResponse } from '../../../services/mappers.js';
import {
  deleteTimetrackingById,
  findTimetrackingById,
  updateTimetrackingById,
} from '../../../services/timetracking-repository.js';
import { idParamsSchema, updateRegistroSchema } from '../schemas.js';

const PRIVILEGED_ROLES: User['rol'][] = ['ADMIN', 'RRHH', 'MANAGER'];

export const registerTimetrackingRecordRoutes = (router: Hono<HonoEnv>) => {
  router.get('/:id', async (c) => {
    const { id } = parseParams(c, idParamsSchema);
    const registro = await findTimetrackingById(id);
    if (!registro) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    return c.json(toTimetrackingResponse(registro));
  });

  router.put('/:id', async (c) => {
    const { id } = parseParams(c, idParamsSchema);
    const payload = await parseJson(c, updateRegistroSchema);
    const registro = await findTimetrackingById(id);
    if (!registro) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }

    const user = c.get('user') as User;
    if (registro.usuarioId !== user.id && !PRIVILEGED_ROLES.includes(user.rol)) {
      throw new HTTPException(403, { message: 'Acceso denegado' });
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

  router.delete('/:id', async (c) => {
    const { id } = parseParams(c, idParamsSchema);
    const registro = await findTimetrackingById(id);
    if (!registro) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }

    const user = c.get('user') as User;
    if (registro.usuarioId !== user.id && !PRIVILEGED_ROLES.includes(user.rol)) {
      throw new HTTPException(403, { message: 'Acceso denegado' });
    }

    await deleteTimetrackingById(id);
    return c.json({ message: 'Registro eliminado' });
  });
};
