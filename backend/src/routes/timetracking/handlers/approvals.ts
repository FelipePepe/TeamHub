import type { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { eq, inArray } from 'drizzle-orm';
import type { HonoEnv } from '../../../types/hono.js';
import { requireRoles } from '../../../middleware/auth.js';
import { parseJson, parseParams } from '../../../validators/parse.js';
import { toTimetrackingResponse } from '../../../services/mappers.js';
import { db } from '../../../db/index.js';
import { timetracking } from '../../../db/schema/timetracking.js';
import { proyectos } from '../../../db/schema/proyectos.js';
import { users } from '../../../db/schema/users.js';
import type { User } from '../../../db/schema/users.js';
import { findTimetrackingById, updateTimetrackingById } from '../../../services/timetracking-repository.js';
import { approveSchema, bulkApproveSchema, idParamsSchema, rejectSchema } from '../schemas.js';
import { toNumber } from '../utils.js';
import { z } from 'zod';

export const registerTimetrackingApprovalRoutes = (router: Hono<HonoEnv>) => {
  router.post('/aprobar-masivo', requireRoles('ADMIN', 'RRHH', 'MANAGER'), async (c) => {
    const payload = await parseJson(c, bulkApproveSchema);
    const user = c.get('user') as User;
    const now = new Date();
    if (payload.ids.length) {
      await db
        .update(timetracking)
        .set({
          estado: 'APROBADO',
          aprobadoPor: user.id,
          aprobadoAt: now,
          rechazadoPor: null,
          rechazadoAt: null,
          comentarioRechazo: null,
          updatedAt: now,
        })
        .where(inArray(timetracking.id, payload.ids));
    }

    return c.json({ message: 'Aprobación masiva completada' });
  });

  router.get('/pendientes-aprobacion', async (c) => {
    const rows = await db
      .select({
        registro: timetracking,
        usuarioNombre: users.nombre,
        proyectoNombre: proyectos.nombre,
      })
      .from(timetracking)
      .innerJoin(users, eq(timetracking.usuarioId, users.id))
      .innerJoin(proyectos, eq(timetracking.proyectoId, proyectos.id))
      .where(eq(timetracking.estado, 'PENDIENTE'));

    const grouped = new Map<
      string,
      {
        usuarioId: string;
        usuarioNombre?: string;
        proyectoId: string;
        proyectoNombre?: string;
        totalHoras: number;
        registros: ReturnType<typeof toTimetrackingResponse>[];
      }
    >();

    rows.forEach(({ registro, usuarioNombre, proyectoNombre }) => {
      const key = `${registro.usuarioId}:${registro.proyectoId}`;
      const existing = grouped.get(key);
      const horas = toNumber(registro.horas, 0);
      if (existing) {
        existing.totalHoras += horas;
        existing.registros.push(toTimetrackingResponse(registro));
      } else {
        grouped.set(key, {
          usuarioId: registro.usuarioId,
          usuarioNombre,
          proyectoId: registro.proyectoId,
          proyectoNombre,
          totalHoras: horas,
          registros: [toTimetrackingResponse(registro)],
        });
      }
    });

    return c.json({ data: Array.from(grouped.values()) });
  });

  router.patch('/:id/aprobar', requireRoles('ADMIN', 'RRHH', 'MANAGER'), async (c) => {
    const { id } = parseParams(c, idParamsSchema);
    await parseJson(c, approveSchema ?? z.object({}));
    const registro = await findTimetrackingById(id);
    if (!registro) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    const user = c.get('user') as User;
    const updated = await updateTimetrackingById(id, {
      estado: 'APROBADO',
      aprobadoPor: user.id,
      aprobadoAt: new Date(),
      rechazadoPor: null,
      rechazadoAt: null,
      comentarioRechazo: null,
      updatedAt: new Date(),
    });
    if (!updated) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    return c.json(toTimetrackingResponse(updated));
  });

  router.patch('/:id/rechazar', requireRoles('ADMIN', 'RRHH', 'MANAGER'), async (c) => {
    const { id } = parseParams(c, idParamsSchema);
    const payload = await parseJson(c, rejectSchema);
    const registro = await findTimetrackingById(id);
    if (!registro) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    const user = c.get('user') as User;
    const updated = await updateTimetrackingById(id, {
      estado: 'RECHAZADO',
      rechazadoPor: user.id,
      rechazadoAt: new Date(),
      aprobadoPor: null,
      aprobadoAt: null,
      comentarioRechazo: payload.comentario,
      updatedAt: new Date(),
    });
    if (!updated) {
      throw new HTTPException(404, { message: 'No encontrado' });
    }
    return c.json(toTimetrackingResponse(updated));
  });
};
