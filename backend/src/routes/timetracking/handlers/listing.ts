import type { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { and, eq } from 'drizzle-orm';
import type { HonoEnv } from '../../../types/hono.js';
import { parseJson, parseParams, parseQuery } from '../../../validators/parse.js';
import { toTimetrackingResponse } from '../../../services/mappers.js';
import { db } from '../../../db/index.js';
import { timetracking } from '../../../db/schema/timetracking.js';
import { proyectos } from '../../../db/schema/proyectos.js';
import type { User } from '../../../db/schema/users.js';
import { createTimetracking, listTimetracking } from '../../../services/timetracking-repository.js';
import {
  copySchema,
  createRegistroSchema,
  listQuerySchema,
  semanaParamsSchema,
} from '../schemas.js';
import { toNumber } from '../utils.js';

export const registerTimetrackingListingRoutes = (router: Hono<HonoEnv>) => {
  router.get('/', async (c) => {
    const query = parseQuery(c, listQuerySchema);
    const registros = await listTimetracking(
      {
        usuarioId: query.usuarioId,
        proyectoId: query.proyectoId,
        estado: query.estado,
        fechaInicio: query.fechaInicio,
        fechaFin: query.fechaFin,
        facturable: query.facturable,
      },
      { page: query.page, limit: query.limit }
    );

    return c.json({ data: registros.map(toTimetrackingResponse) });
  });

  router.post('/', async (c) => {
    const payload = await parseJson(c, createRegistroSchema);
    const user = c.get('user') as User;

    // Only ADMIN, RRHH, or MANAGER can create timetracking for other users
    const targetUserId = payload.usuarioId ?? user.id;
    if (targetUserId !== user.id) {
      const privilegedRoles: User['rol'][] = ['ADMIN', 'RRHH', 'MANAGER'];
      if (!privilegedRoles.includes(user.rol)) {
        throw new HTTPException(403, { message: 'No autorizado para registrar horas de otro usuario' });
      }
    }

    const now = new Date();
    const registro = await createTimetracking({
      usuarioId: targetUserId,
      proyectoId: payload.proyectoId,
      fecha: payload.fecha,
      horas: payload.horas.toString(),
      descripcion: payload.descripcion,
      facturable: payload.facturable ?? true,
      estado: 'PENDIENTE',
      createdAt: now,
      updatedAt: now,
    });
    if (!registro) {
      throw new HTTPException(500, { message: 'Error al crear registro' });
    }

    return c.json(toTimetrackingResponse(registro), 201);
  });

  router.get('/mis-registros', async (c) => {
    const user = c.get('user') as User;
    const registros = await listTimetracking({ usuarioId: user.id });
    return c.json({ data: registros.map(toTimetrackingResponse) });
  });

  router.get('/semana/:fecha', async (c) => {
    const { fecha } = parseParams(c, semanaParamsSchema);
    const registros = await listTimetracking({ fechaInicio: fecha, fechaFin: fecha });
    return c.json({ data: registros.map(toTimetrackingResponse) });
  });

  router.get('/resumen', async (c) => {
    const query = parseQuery(c, listQuerySchema);
    const user = c.get('user') as User;
    const clauses = [];
    // Default to current user if no usuarioId specified
    const targetUserId = query.usuarioId ?? user.id;
    clauses.push(eq(timetracking.usuarioId, targetUserId));
    if (query.proyectoId) {
      clauses.push(eq(timetracking.proyectoId, query.proyectoId));
    }

    const baseQuery = db
      .select({ registro: timetracking, proyectoNombre: proyectos.nombre })
      .from(timetracking)
      .innerJoin(proyectos, eq(timetracking.proyectoId, proyectos.id));
    const whereClause = clauses.length ? and(...clauses) : undefined;
    const rows = await (whereClause ? baseQuery.where(whereClause) : baseQuery);

    const totalHoras = rows.reduce((sum, item) => sum + toNumber(item.registro.horas, 0), 0);
    const horasFacturables = rows
      .filter((item) => item.registro.facturable)
      .reduce((sum, item) => sum + toNumber(item.registro.horas, 0), 0);
    const horasNoFacturables = totalHoras - horasFacturables;

    const porProyecto = Array.from(
      rows.reduce<
        Map<string, { proyectoId: string; nombre?: string; horas: number }>
      >((acc, item) => {
        const existing = acc.get(item.registro.proyectoId) ?? {
          proyectoId: item.registro.proyectoId,
          nombre: item.proyectoNombre,
          horas: 0,
        };
        existing.horas += toNumber(item.registro.horas, 0);
        acc.set(item.registro.proyectoId, existing);
        return acc;
      }, new Map())
    ).map((entry) => entry[1]);

    const porDia = Array.from(
      rows.reduce<Map<string, { fecha: string; horas: number }>>((acc, item) => {
        const fecha = String(item.registro.fecha);
        const existing = acc.get(fecha) ?? { fecha, horas: 0 };
        existing.horas += toNumber(item.registro.horas, 0);
        acc.set(fecha, existing);
        return acc;
      }, new Map())
    ).map((entry) => entry[1]);

    const porEstado = Array.from(
      rows.reduce<Map<string, { estado: string; horas: number }>>((acc, item) => {
        const estado = String(item.registro.estado);
        const existing = acc.get(estado) ?? { estado, horas: 0 };
        existing.horas += toNumber(item.registro.horas, 0);
        acc.set(estado, existing);
        return acc;
      }, new Map())
    ).map((entry) => entry[1]);

    return c.json({
      totalHoras,
      horasFacturables,
      horasNoFacturables,
      porProyecto,
      porDia,
      porEstado,
    });
  });

  router.post('/copiar', async (c) => {
    const payload = await parseJson(c, copySchema);
    const user = c.get('user') as User;
    const registros = await db
      .select()
      .from(timetracking)
      .where(and(eq(timetracking.usuarioId, user.id), eq(timetracking.fecha, payload.fechaOrigen)));

    const now = new Date();
    if (registros.length) {
      await db.insert(timetracking).values(
        registros.map((registro) => ({
          usuarioId: registro.usuarioId,
          proyectoId: registro.proyectoId,
          asignacionId: registro.asignacionId,
          fecha: payload.fechaDestino,
          horas: registro.horas,
          descripcion: registro.descripcion,
          facturable: registro.facturable,
          estado: 'PENDIENTE' as const,
          aprobadoPor: null,
          aprobadoAt: null,
          rechazadoPor: null,
          rechazadoAt: null,
          comentarioRechazo: null,
          createdAt: now,
          updatedAt: now,
        }))
      );
    }

    return c.json({ copied: registros.length, message: 'Registros copiados' });
  });
};
