import { and, asc, eq, gte, isNotNull, isNull, lt, ne, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { departamentos } from '../../db/schema/departamentos.js';
import { procesosOnboarding, tareasOnboarding } from '../../db/schema/procesos.js';
import { users } from '../../db/schema/users.js';
import { MAX_ALERT_ITEMS, MONTH_POINTS } from './constants.js';
import {
  buildAlertsFromTareas,
  formatNombreCompleto,
  getMonthRange,
  toDateString,
  toNumber,
} from './utils.js';

export const buildRrhhDashboardResponse = async () => {
  const now = new Date();
  const { startDate, endDate, today } = getMonthRange(now);
  const startMonthHistory = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (MONTH_POINTS - 1), 1));
  const startMonthHistoryDate = toDateString(startMonthHistory);

  const [
    onboardingsEnCursoRow,
    completadosMesRow,
    tiempoMedioRow,
    tareasVencidasRow,
    empleadosPorDepartamentoRows,
    evolucionAltasRows,
    procesosEnCursoRows,
    alertasRows,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(procesosOnboarding)
      .where(and(eq(procesosOnboarding.estado, 'EN_CURSO'), isNull(procesosOnboarding.deletedAt))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(procesosOnboarding)
      .where(
        and(
          eq(procesosOnboarding.estado, 'COMPLETADO'),
          isNotNull(procesosOnboarding.fechaFinReal),
          gte(procesosOnboarding.fechaFinReal, startDate),
          lt(procesosOnboarding.fechaFinReal, endDate)
        )
      ),
    db
      .select({
        promedio: sql<number>`coalesce(avg((${procesosOnboarding.fechaFinReal} - ${procesosOnboarding.fechaInicio})::numeric), 0)`,
      })
      .from(procesosOnboarding)
      .where(and(eq(procesosOnboarding.estado, 'COMPLETADO'), isNotNull(procesosOnboarding.fechaFinReal))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(tareasOnboarding)
      .where(
        and(
          isNotNull(tareasOnboarding.fechaLimite),
          lt(tareasOnboarding.fechaLimite, today),
          ne(tareasOnboarding.estado, 'COMPLETADA'),
          ne(tareasOnboarding.estado, 'CANCELADA')
        )
      ),
    db
      .select({
        departamentoId: users.departamentoId,
        departamentoNombre: departamentos.nombre,
        total: sql<number>`count(*)`,
      })
      .from(users)
      .leftJoin(departamentos, eq(users.departamentoId, departamentos.id))
      .where(isNull(users.deletedAt))
      .groupBy(users.departamentoId, departamentos.nombre),
    db
      .select({
        mes: sql<string>`date_trunc('month', ${users.createdAt})`,
        total: sql<number>`count(*)`,
      })
      .from(users)
      .where(and(isNull(users.deletedAt), gte(users.createdAt, startMonthHistory)))
      .groupBy(sql`date_trunc('month', ${users.createdAt})`)
      .orderBy(sql`date_trunc('month', ${users.createdAt})`),
    db
      .select({
        proceso: procesosOnboarding,
        nombre: users.nombre,
        apellidos: users.apellidos,
      })
      .from(procesosOnboarding)
      .innerJoin(users, eq(procesosOnboarding.empleadoId, users.id))
      .where(and(eq(procesosOnboarding.estado, 'EN_CURSO'), isNull(procesosOnboarding.deletedAt)))
      .orderBy(asc(procesosOnboarding.fechaInicio))
      .limit(MAX_ALERT_ITEMS),
    db
      .select()
      .from(tareasOnboarding)
      .where(
        and(
          isNotNull(tareasOnboarding.fechaLimite),
          lt(tareasOnboarding.fechaLimite, today),
          ne(tareasOnboarding.estado, 'COMPLETADA'),
          ne(tareasOnboarding.estado, 'CANCELADA')
        )
      )
      .orderBy(asc(tareasOnboarding.fechaLimite))
      .limit(MAX_ALERT_ITEMS),
  ]);

  const evolucionMap = new Map<string, number>();
  evolucionAltasRows.forEach((row) => {
    const mes = row.mes ? toDateString(new Date(row.mes)) : startMonthHistoryDate;
    evolucionMap.set(mes, toNumber(row.total, 0));
  });
  const evolucionAltas = [];
  for (let i = 0; i < MONTH_POINTS; i += 1) {
    const pointDate = new Date(Date.UTC(startMonthHistory.getUTCFullYear(), startMonthHistory.getUTCMonth() + i, 1));
    const key = toDateString(pointDate);
    evolucionAltas.push({ fecha: key, value: evolucionMap.get(key) ?? 0 });
  }

  return {
    kpis: {
      onboardingsEnCurso: toNumber(onboardingsEnCursoRow[0]?.count, 0),
      completadosMes: toNumber(completadosMesRow[0]?.count, 0),
      tiempoMedioOnboardingDias: toNumber(tiempoMedioRow[0]?.promedio, 0),
      tareasVencidas: toNumber(tareasVencidasRow[0]?.count, 0),
    },
    charts: {
      empleadosPorDepartamento: empleadosPorDepartamentoRows.map((row) => ({
        id: row.departamentoId ?? 'sin_departamento',
        label: row.departamentoNombre ?? 'Sin departamento',
        value: toNumber(row.total, 0),
      })),
      evolucionAltas,
    },
    sections: {
      onboardingsEnCurso: procesosEnCursoRows.map((row) => ({
        procesoId: row.proceso.id,
        empleadoId: row.proceso.empleadoId,
        empleadoNombre: formatNombreCompleto(row.nombre, row.apellidos),
        progreso: toNumber(row.proceso.progreso, 0),
        fechaInicio: row.proceso.fechaInicio,
        fechaFinEsperada: row.proceso.fechaFinEsperada ?? undefined,
      })),
      alertas: buildAlertsFromTareas(alertasRows, now),
    },
  };
};
