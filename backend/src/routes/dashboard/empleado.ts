import { and, asc, desc, eq, gte, isNotNull, isNull, lt, ne, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { asignaciones, proyectos } from '../../db/schema/proyectos.js';
import { procesosOnboarding, tareasOnboarding } from '../../db/schema/procesos.js';
import { timetracking } from '../../db/schema/timetracking.js';
import type { User } from '../../db/schema/users.js';
import { DAYS_WEEK, MAX_TEAM_ITEMS, TIMETRACKING_ESTADO_LABELS } from './constants.js';
import { getMonthRange, getRecentDates, toNumber } from './utils.js';

export const buildEmpleadoDashboardResponse = async (user: User) => {
  const now = new Date();
  const { startDate, endDate, today } = getMonthRange(now);
  const weekDates = getRecentDates(DAYS_WEEK, now);

  const [
    horasMesRow,
    proyectosActivosRow,
    ocupacionRow,
    tareasPendientesRow,
    horasPorEstadoRows,
    horasSemanaRows,
    procesoRow,
    tareasRow,
    proyectosRows,
  ] = await Promise.all([
    db
      .select({ total: sql<number>`coalesce(sum(${timetracking.horas}), 0)` })
      .from(timetracking)
      .where(
        and(
          eq(timetracking.usuarioId, user.id),
          gte(timetracking.fecha, startDate),
          lt(timetracking.fecha, endDate)
        )
      ),
    db
      .select({ count: sql<number>`count(distinct ${asignaciones.proyectoId})` })
      .from(asignaciones)
      .innerJoin(proyectos, eq(asignaciones.proyectoId, proyectos.id))
      .where(
        and(
          eq(asignaciones.usuarioId, user.id),
          isNull(asignaciones.deletedAt),
          eq(proyectos.estado, 'ACTIVO'),
          isNull(proyectos.deletedAt)
        )
      ),
    db
      .select({ total: sql<number>`coalesce(sum(${asignaciones.dedicacionPorcentaje}), 0)` })
      .from(asignaciones)
      .where(and(eq(asignaciones.usuarioId, user.id), isNull(asignaciones.deletedAt))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(tareasOnboarding)
      .where(
        and(
          eq(tareasOnboarding.responsableId, user.id),
          ne(tareasOnboarding.estado, 'COMPLETADA'),
          ne(tareasOnboarding.estado, 'CANCELADA')
        )
      ),
    db
      .select({ estado: timetracking.estado, total: sql<number>`coalesce(sum(${timetracking.horas}), 0)` })
      .from(timetracking)
      .where(
        and(
          eq(timetracking.usuarioId, user.id),
          gte(timetracking.fecha, startDate),
          lt(timetracking.fecha, endDate)
        )
      )
      .groupBy(timetracking.estado),
    db
      .select({ fecha: timetracking.fecha, total: sql<number>`coalesce(sum(${timetracking.horas}), 0)` })
      .from(timetracking)
      .where(and(eq(timetracking.usuarioId, user.id), gte(timetracking.fecha, weekDates[0])))
      .groupBy(timetracking.fecha),
    db
      .select()
      .from(procesosOnboarding)
      .where(and(eq(procesosOnboarding.empleadoId, user.id), eq(procesosOnboarding.estado, 'EN_CURSO')))
      .orderBy(desc(procesosOnboarding.fechaInicio))
      .limit(1),
    db
      .select()
      .from(tareasOnboarding)
      .where(
        and(
          eq(tareasOnboarding.responsableId, user.id),
          isNotNull(tareasOnboarding.fechaLimite),
          gte(tareasOnboarding.fechaLimite, today),
          ne(tareasOnboarding.estado, 'COMPLETADA'),
          ne(tareasOnboarding.estado, 'CANCELADA')
        )
      )
      .orderBy(asc(tareasOnboarding.fechaLimite))
      .limit(MAX_TEAM_ITEMS),
    db
      .select({
        proyectoId: proyectos.id,
        nombre: proyectos.nombre,
        rol: asignaciones.rol,
        dedicacionPorcentaje: asignaciones.dedicacionPorcentaje,
      })
      .from(asignaciones)
      .innerJoin(proyectos, eq(asignaciones.proyectoId, proyectos.id))
      .where(and(eq(asignaciones.usuarioId, user.id), isNull(asignaciones.deletedAt), isNull(proyectos.deletedAt))),
  ]);

  const horasSemanaMap = new Map<string, number>();
  horasSemanaRows.forEach((row) => {
    horasSemanaMap.set(String(row.fecha), toNumber(row.total, 0));
  });

  return {
    kpis: {
      horasMes: toNumber(horasMesRow[0]?.total, 0),
      proyectosActivos: toNumber(proyectosActivosRow[0]?.count, 0),
      ocupacion: toNumber(ocupacionRow[0]?.total, 0),
      tareasPendientes: toNumber(tareasPendientesRow[0]?.count, 0),
    },
    charts: {
      horasPorEstado: horasPorEstadoRows.map((row) => ({
        id: row.estado,
        label: TIMETRACKING_ESTADO_LABELS[row.estado] ?? row.estado,
        value: toNumber(row.total, 0),
      })),
      horasPorSemana: weekDates.map((fecha) => ({
        fecha,
        value: horasSemanaMap.get(fecha) ?? 0,
      })),
    },
    sections: {
      onboarding: {
        progreso: toNumber(procesoRow[0]?.progreso, 0),
        proximasTareas: tareasRow.map((tarea) => ({
          tareaId: tarea.id,
          titulo: tarea.titulo,
          fechaLimite: tarea.fechaLimite ?? undefined,
        })),
      },
      misProyectos: proyectosRows.map((row) => ({
        proyectoId: row.proyectoId,
        nombre: row.nombre,
        rol: row.rol ?? undefined,
        dedicacionPorcentaje: toNumber(row.dedicacionPorcentaje, 0),
      })),
    },
  };
};
