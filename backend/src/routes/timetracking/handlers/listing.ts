import type { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { and, eq, inArray } from 'drizzle-orm';
import type { HonoEnv } from '../../../types/hono.js';
import { parseJson, parseParams, parseQuery } from '../../../validators/parse.js';
import { toTimetrackingResponse } from '../../../services/mappers.js';
import { db } from '../../../db/index.js';
import { timetracking } from '../../../db/schema/timetracking.js';
import { proyectos } from '../../../db/schema/proyectos.js';
import { createTimetracking, listTimetracking } from '../../../services/timetracking-repository.js';
import { syncHorasConsumidas } from '../../../services/proyectos-repository.js';
import {
  copySchema,
  createRegistroSchema,
  listQuerySchema,
  semanaParamsSchema,
  semanaQuerySchema,
} from '../schemas.js';
import { toNumber } from '../utils.js';
import { assertCanWrite, getTeamMemberIds, resolveAllowedUserIds } from './auth-utils.js';

/**
 * Calcula la fecha fin de semana (fecha + 6 días) a partir de una fecha ISO YYYY-MM-DD.
 * Usa aritmética local para evitar problemas de zona horaria.
 * @param fechaIso - Fecha de inicio en formato YYYY-MM-DD.
 * @returns Fecha fin en formato YYYY-MM-DD.
 */
function calcularFinSemana(fechaIso: string): string {
  const [year, month, day] = fechaIso.split('-').map(Number);
  const end = new Date(year, month - 1, day + 6);
  const y = end.getFullYear();
  const m = String(end.getMonth() + 1).padStart(2, '0');
  const d = String(end.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const registerTimetrackingListingRoutes = (router: Hono<HonoEnv>) => {
  /**
   * GET /timetracking
   * - ADMIN / RRHH: pueden filtrar por cualquier usuarioId (o ver todos).
   * - MANAGER: ve su equipo + él mismo. Si filtra por un usuarioId de fuera del equipo → 403.
   * - EMPLEADO: solo sus propios registros.
   */
  router.get('/', async (c) => {
    const query = parseQuery(c, listQuerySchema);
    const user = c.get('user');
    const teamIds = user.rol === 'MANAGER' ? await getTeamMemberIds(user.id) : [];
    const allowedIds = resolveAllowedUserIds(user, query.usuarioId, teamIds);

    const filters =
      allowedIds === 'ALL'
        ? { proyectoId: query.proyectoId, estado: query.estado, fechaInicio: query.fechaInicio, fechaFin: query.fechaFin, facturable: query.facturable }
        : { usuarioIds: allowedIds, proyectoId: query.proyectoId, estado: query.estado, fechaInicio: query.fechaInicio, fechaFin: query.fechaFin, facturable: query.facturable };

    const registros = await listTimetracking(filters, { page: query.page, limit: query.limit });
    return c.json({ data: registros.map(toTimetrackingResponse) });
  });

  /**
   * POST /timetracking
   * - ADMIN: puede crear para cualquier usuario.
   * - RRHH: solo lectura → 403.
   * - MANAGER: puede crear para sí mismo y su equipo.
   * - EMPLEADO: solo para sí mismo.
   */
  router.post('/', async (c) => {
    const payload = await parseJson(c, createRegistroSchema);
    const user = c.get('user');
    const targetUserId = payload.usuarioId ?? user.id;
    const teamIds = user.rol === 'MANAGER' ? await getTeamMemberIds(user.id) : [];
    assertCanWrite(user, targetUserId, teamIds);

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
    await syncHorasConsumidas(registro.proyectoId);
    return c.json(toTimetrackingResponse(registro), 201);
  });

  /**
   * GET /timetracking/mis-registros
   * Siempre devuelve los registros del usuario autenticado.
   */
  router.get('/mis-registros', async (c) => {
    const user = c.get('user');
    const registros = await listTimetracking({ usuarioId: user.id });
    return c.json({ data: registros.map(toTimetrackingResponse) });
  });

  /**
   * GET /timetracking/semana/:fecha?usuarioId=xxx
   * - ADMIN / RRHH: pueden consultar la semana de cualquier usuario.
   * - MANAGER: pueden consultar la semana de su equipo + la propia.
   * - EMPLEADO: solo la suya.
   */
  router.get('/semana/:fecha', async (c) => {
    const { fecha } = parseParams(c, semanaParamsSchema);
    const { usuarioId: requestedUserId } = parseQuery(c, semanaQuerySchema);
    const user = c.get('user');
    const teamIds = user.rol === 'MANAGER' ? await getTeamMemberIds(user.id) : [];
    const allowedIds = resolveAllowedUserIds(user, requestedUserId, teamIds);
    const fechaFin = calcularFinSemana(fecha);

    const filters =
      allowedIds === 'ALL'
        ? { fechaInicio: fecha, fechaFin }
        : { usuarioIds: allowedIds, fechaInicio: fecha, fechaFin };

    const registros = await listTimetracking(filters);
    return c.json({ data: registros.map(toTimetrackingResponse) });
  });

  /**
   * GET /timetracking/resumen?usuarioId=xxx
   * Mismas reglas de acceso que la lista general.
   */
  router.get('/resumen', async (c) => {
    const query = parseQuery(c, listQuerySchema);
    const user = c.get('user');
    const teamIds = user.rol === 'MANAGER' ? await getTeamMemberIds(user.id) : [];
    const allowedIds = resolveAllowedUserIds(user, query.usuarioId, teamIds);

    const baseQuery = db
      .select({ registro: timetracking, proyectoNombre: proyectos.nombre })
      .from(timetracking)
      .innerJoin(proyectos, eq(timetracking.proyectoId, proyectos.id));

    let userClause;
    if (allowedIds === 'ALL') {
      userClause = undefined;
    } else if (allowedIds.length === 1) {
      userClause = eq(timetracking.usuarioId, allowedIds[0]);
    } else {
      userClause = inArray(timetracking.usuarioId, allowedIds);
    }
    const proyectoClause = query.proyectoId ? eq(timetracking.proyectoId, query.proyectoId) : undefined;
    const whereClause = userClause && proyectoClause ? and(userClause, proyectoClause) : (userClause ?? proyectoClause);

    const rows = await (whereClause ? baseQuery.where(whereClause) : baseQuery);

    const totalHoras = rows.reduce((sum, item) => sum + toNumber(item.registro.horas, 0), 0);
    const horasFacturables = rows
      .filter((item) => item.registro.facturable)
      .reduce((sum, item) => sum + toNumber(item.registro.horas, 0), 0);
    const horasNoFacturables = totalHoras - horasFacturables;

    const porProyecto = Array.from(
      rows.reduce<Map<string, { proyectoId: string; nombre?: string; horas: number }>>(
        (acc, item) => {
          const existing = acc.get(item.registro.proyectoId) ?? {
            proyectoId: item.registro.proyectoId,
            nombre: item.proyectoNombre,
            horas: 0,
          };
          existing.horas += toNumber(item.registro.horas, 0);
          acc.set(item.registro.proyectoId, existing);
          return acc;
        },
        new Map()
      )
    ).map((entry) => entry[1]);

    const porDia = Array.from(
      rows.reduce<Map<string, { fecha: string; horas: number }>>((acc, item) => {
        const f = String(item.registro.fecha);
        const existing = acc.get(f) ?? { fecha: f, horas: 0 };
        existing.horas += toNumber(item.registro.horas, 0);
        acc.set(f, existing);
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

    return c.json({ totalHoras, horasFacturables, horasNoFacturables, porProyecto, porDia, porEstado });
  });

  /**
   * POST /timetracking/copiar
   * Copia los registros del propio usuario de una semana a otra.
   */
  router.post('/copiar', async (c) => {
    const payload = await parseJson(c, copySchema);
    const user = c.get('user');
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
      const uniqueProyectoIds = [...new Set(registros.map((r) => r.proyectoId))];
      await Promise.all(uniqueProyectoIds.map(syncHorasConsumidas));
    }

    return c.json({ copied: registros.length, message: 'Registros copiados' });
  });
};
