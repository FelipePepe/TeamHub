import { and, asc, desc, eq, gte, isNotNull, isNull, lt, ne, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { auditLog } from '../../db/schema/audit.js';
import { departamentos } from '../../db/schema/departamentos.js';
import { procesosOnboarding, tareasOnboarding } from '../../db/schema/procesos.js';
import { proyectos } from '../../db/schema/proyectos.js';
import { timetracking } from '../../db/schema/timetracking.js';
import { users } from '../../db/schema/users.js';
import { MAX_ACTIVITY_ITEMS, MAX_ALERT_ITEMS } from './constants.js';
import { buildAlertsFromTareas, getMonthRange, toNumber } from './utils.js';

/**
 * Ejecuta consultas en paralelo o en serie según entorno.
 * En tests se ejecutan en serie para evitar agotar conexiones.
 * @param queries - Funciones que devuelven promesas de consulta.
 * @returns Resultados en el mismo orden.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const runQueries = async (queries: Array<() => Promise<any>>): Promise<any[]> => {
  if (process.env.NODE_ENV === 'test') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any[] = [];
    for (const query of queries) {
      results.push(await query());
    }
    return results;
  }
  return Promise.all(queries.map((query) => query()));
};

export const buildAdminDashboardResponse = async () => {
  const now = new Date();
  const { start, end, startDate, endDate, today } = getMonthRange(now);

  const [
    usuariosActivosRow,
    altasMesRow,
    proyectosActivosRow,
    horasMesRow,
    onboardingsEnCursoRow,
    tareasVencidasRow,
    usuariosPorRolRows,
    usuariosPorDepartamentoRows,
    proyectosPorEstadoRows,
    horasPorEstadoRows,
    actividadRows,
    alertasRows,
  ] = await runQueries([
    () => db.select({ count: sql<number>`count(*)` }).from(users).where(isNull(users.deletedAt)),
    () =>
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(isNull(users.deletedAt), gte(users.createdAt, start), lt(users.createdAt, end))),
    () =>
      db
        .select({ count: sql<number>`count(*)` })
        .from(proyectos)
        .where(and(isNull(proyectos.deletedAt), eq(proyectos.estado, 'ACTIVO'))),
    () =>
      db
        .select({
          total: sql<number>`coalesce(sum(${timetracking.horas}), 0)`,
        })
        .from(timetracking)
        .where(and(gte(timetracking.fecha, startDate), lt(timetracking.fecha, endDate))),
    () =>
      db
        .select({ count: sql<number>`count(*)` })
        .from(procesosOnboarding)
        .where(and(eq(procesosOnboarding.estado, 'EN_CURSO'), isNull(procesosOnboarding.deletedAt))),
    () =>
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
    () =>
      db
        .select({ rol: users.rol, total: sql<number>`count(*)` })
        .from(users)
        .where(isNull(users.deletedAt))
        .groupBy(users.rol),
    () =>
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
    () =>
      db
        .select({ estado: proyectos.estado, total: sql<number>`count(*)` })
        .from(proyectos)
        .where(isNull(proyectos.deletedAt))
        .groupBy(proyectos.estado),
    () =>
      db
        .select({ estado: timetracking.estado, total: sql<number>`coalesce(sum(${timetracking.horas}), 0)` })
        .from(timetracking)
        .where(and(gte(timetracking.fecha, startDate), lt(timetracking.fecha, endDate)))
        .groupBy(timetracking.estado),
    () =>
      db
        .select({
          id: auditLog.id,
          operation: auditLog.operation,
          tableName: auditLog.tableName,
          recordId: auditLog.recordId,
          usuarioId: auditLog.usuarioId,
          usuarioEmail: auditLog.usuarioEmail,
          changedFields: auditLog.changedFields,
          oldData: auditLog.oldData,
          newData: auditLog.newData,
          createdAt: auditLog.createdAt,
        })
        .from(auditLog)
        .orderBy(desc(auditLog.createdAt))
        .limit(MAX_ACTIVITY_ITEMS),
    () =>
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

  const usuariosActivos = toNumber(usuariosActivosRow[0]?.count, 0);
  const altasMes = toNumber(altasMesRow[0]?.count, 0);
  const proyectosActivos = toNumber(proyectosActivosRow[0]?.count, 0);
  const horasMes = toNumber(horasMesRow[0]?.total, 0);
  const onboardingsEnCurso = toNumber(onboardingsEnCursoRow[0]?.count, 0);
  const tareasVencidas = toNumber(tareasVencidasRow[0]?.count, 0);

  return {
    kpis: {
      usuariosActivos,
      altasMes,
      proyectosActivos,
      horasMes,
      onboardingsEnCurso,
      tareasVencidas,
    },
    charts: {
      usuariosPorRol: usuariosPorRolRows.map((row: { rol: string; total: number }) => ({
        id: row.rol,
        label: row.rol,
        value: toNumber(row.total, 0),
      })),
      usuariosPorDepartamento: usuariosPorDepartamentoRows.map((row: { departamentoId: string | null; departamentoNombre: string | null; total: number }) => ({
        id: row.departamentoId ?? 'sin_departamento',
        label: row.departamentoNombre ?? 'Sin departamento',
        value: toNumber(row.total, 0),
      })),
      proyectosPorEstado: proyectosPorEstadoRows.map((row: { estado: string; total: number }) => ({
        id: row.estado,
        label: row.estado,
        value: toNumber(row.total, 0),
      })),
      horasPorEstado: horasPorEstadoRows.map((row: { estado: string; total: number }) => ({
        id: row.estado,
        label: row.estado,
        value: toNumber(row.total, 0),
      })),
    },
    listas: {
      actividadReciente: actividadRows.map((row: { id: string; operation: string; tableName: string; recordId: string; usuarioId: string | null; usuarioEmail: string | null; changedFields: unknown; oldData: unknown; newData: unknown; createdAt: Date | null }) => {
        const sensitiveKeys = ['password_hash', 'mfa_secret', 'mfa_recovery_codes', 'passwordHash', 'mfaSecret', 'mfaRecoveryCodes'];
        const filterSensitive = (data: unknown): unknown => {
          if (data && typeof data === 'object' && !Array.isArray(data)) {
            const filtered: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
              if (!sensitiveKeys.includes(key)) {
                filtered[key] = value;
              }
            }
            return filtered;
          }
          return data;
        };
        return {
          id: row.id,
          tipo: `${row.operation}:${row.tableName}`,
          descripcion: `${row.operation} en ${row.tableName}`,
          operation: row.operation,
          tableName: row.tableName,
          recordId: row.recordId,
          usuarioId: row.usuarioId ?? undefined,
          usuarioEmail: row.usuarioEmail ?? undefined,
          changedFields: row.changedFields ?? undefined,
          oldData: filterSensitive(row.oldData) ?? undefined,
          newData: filterSensitive(row.newData) ?? undefined,
          fecha: row.createdAt?.toISOString(),
        };
      }),
      alertasCriticas: buildAlertsFromTareas(alertasRows, now),
    },
  };
};
