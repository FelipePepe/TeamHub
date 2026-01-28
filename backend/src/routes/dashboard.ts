import type { HonoEnv } from '../types/hono.js';
import { Hono } from 'hono';
import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, lt, ne, sql } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { auditLog } from '../db/schema/audit.js';
import { departamentos } from '../db/schema/departamentos.js';
import { procesosOnboarding, tareasOnboarding } from '../db/schema/procesos.js';
import { asignaciones, proyectos } from '../db/schema/proyectos.js';
import { timetracking } from '../db/schema/timetracking.js';
import { users } from '../db/schema/users.js';
import type { User } from '../db/schema/users.js';

export const dashboardRoutes = new Hono<HonoEnv>();

dashboardRoutes.use('*', authMiddleware);

const MAX_ACTIVITY_ITEMS = 6;
const MAX_ALERT_ITEMS = 6;
const MAX_TEAM_ITEMS = 8;
const DAYS_WEEK = 7;
const CRITICAL_OVERDUE_DAYS = 7;
const MONTH_POINTS = 6;

const toDateString = (date: Date) => date.toISOString().slice(0, 10);

const getMonthRange = (now: Date) => {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return {
    start,
    end,
    startDate: toDateString(start),
    endDate: toDateString(end),
    today: toDateString(now),
  };
};

const getRecentDates = (days: number, now: Date) => {
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(base);
    date.setUTCDate(base.getUTCDate() - i);
    dates.push(toDateString(date));
  }
  return dates;
};

const toNumber = (value: unknown, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatNombreCompleto = (nombre?: string | null, apellidos?: string | null) =>
  [nombre, apellidos].filter(Boolean).join(' ').trim();

const mapTareaPriority = (prioridad?: string | null, overdueDays = 0) => {
  if (overdueDays >= CRITICAL_OVERDUE_DAYS) return 'CRITICA';
  if (prioridad === 'ALTA' || prioridad === 'URGENTE') return 'ALTA';
  if (prioridad === 'BAJA') return 'BAJA';
  return 'MEDIA';
};

const buildAlertsFromTareas = (rows: Array<typeof tareasOnboarding.$inferSelect>, now: Date) => {
  return rows.map((tarea) => {
    const limite = tarea.fechaLimite ? new Date(tarea.fechaLimite) : now;
    const overdueDays = Math.floor((now.getTime() - limite.getTime()) / (1000 * 60 * 60 * 24));
    return {
      id: tarea.id,
      titulo: tarea.titulo,
      descripcion: tarea.descripcion ?? undefined,
      prioridad: mapTareaPriority(tarea.prioridad, overdueDays),
      fecha: tarea.fechaLimite ? new Date(`${tarea.fechaLimite}T00:00:00Z`).toISOString() : undefined,
    };
  });
};

dashboardRoutes.get('/admin', async (c) => {
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
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users).where(isNull(users.deletedAt)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(isNull(users.deletedAt), gte(users.createdAt, start), lt(users.createdAt, end))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(proyectos)
      .where(and(isNull(proyectos.deletedAt), eq(proyectos.estado, 'ACTIVO'))),
    db
      .select({
        total: sql<number>`coalesce(sum(${timetracking.horas}), 0)`,
      })
      .from(timetracking)
      .where(and(gte(timetracking.fecha, startDate), lt(timetracking.fecha, endDate))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(procesosOnboarding)
      .where(and(eq(procesosOnboarding.estado, 'EN_CURSO'), isNull(procesosOnboarding.deletedAt))),
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
      .select({ rol: users.rol, total: sql<number>`count(*)` })
      .from(users)
      .where(isNull(users.deletedAt))
      .groupBy(users.rol),
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
      .select({ estado: proyectos.estado, total: sql<number>`count(*)` })
      .from(proyectos)
      .where(isNull(proyectos.deletedAt))
      .groupBy(proyectos.estado),
    db
      .select({ estado: timetracking.estado, total: sql<number>`coalesce(sum(${timetracking.horas}), 0)` })
      .from(timetracking)
      .where(and(gte(timetracking.fecha, startDate), lt(timetracking.fecha, endDate)))
      .groupBy(timetracking.estado),
    db
      .select({
        id: auditLog.id,
        operation: auditLog.operation,
        tableName: auditLog.tableName,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .orderBy(desc(auditLog.createdAt))
      .limit(MAX_ACTIVITY_ITEMS),
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

  return c.json({
    kpis: {
      usuariosActivos,
      altasMes,
      proyectosActivos,
      horasMes,
      onboardingsEnCurso,
      tareasVencidas,
    },
    charts: {
      usuariosPorRol: usuariosPorRolRows.map((row) => ({
        id: row.rol,
        label: row.rol,
        value: toNumber(row.total, 0),
      })),
      usuariosPorDepartamento: usuariosPorDepartamentoRows.map((row) => ({
        id: row.departamentoId ?? 'sin_departamento',
        label: row.departamentoNombre ?? 'Sin departamento',
        value: toNumber(row.total, 0),
      })),
      proyectosPorEstado: proyectosPorEstadoRows.map((row) => ({
        id: row.estado,
        label: row.estado,
        value: toNumber(row.total, 0),
      })),
      horasPorEstado: horasPorEstadoRows.map((row) => ({
        id: row.estado,
        label: row.estado,
        value: toNumber(row.total, 0),
      })),
    },
    listas: {
      actividadReciente: actividadRows.map((row) => ({
        id: row.id,
        tipo: `${row.operation}:${row.tableName}`,
        descripcion: `${row.operation} en ${row.tableName}`,
        fecha: row.createdAt?.toISOString(),
      })),
      alertasCriticas: buildAlertsFromTareas(alertasRows, now),
    },
  });
});

dashboardRoutes.get('/rrhh', async (c) => {
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

  return c.json({
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
  });
});

dashboardRoutes.get('/manager', async (c) => {
  const user = c.get('user') as User;
  const now = new Date();
  const weekDates = getRecentDates(DAYS_WEEK, now);

  const teamMembers = await db
    .select({ id: users.id, nombre: users.nombre, apellidos: users.apellidos })
    .from(users)
    .where(and(eq(users.managerId, user.id), isNull(users.deletedAt)));

  const teamIds = teamMembers.map((member) => member.id);
  if (!teamIds.length) {
    return c.json({
      kpis: {
        miembrosEquipo: 0,
        cargaPromedio: 0,
        horasPendientesAprobar: 0,
        proyectosActivos: 0,
      },
      charts: {
        equipoPorProyecto: [],
        horasEquipoSemana: weekDates.map((fecha) => ({ fecha, value: 0 })),
      },
      sections: {
        equipoOcupacion: [],
        pendientesAprobacion: [],
      },
    });
  }

  const [
    proyectosActivosRow,
    pendientesRow,
    equipoPorProyectoRows,
    horasSemanaRows,
    ocupacionRows,
    pendientesHorasRows,
    pendientesAprobacionRows,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(proyectos)
      .where(
        and(eq(proyectos.managerId, user.id), eq(proyectos.estado, 'ACTIVO'), isNull(proyectos.deletedAt))
      ),
    db
      .select({ total: sql<number>`coalesce(sum(${timetracking.horas}), 0)` })
      .from(timetracking)
      .where(and(inArray(timetracking.usuarioId, teamIds), eq(timetracking.estado, 'PENDIENTE'))),
    db
      .select({
        proyectoId: proyectos.id,
        nombre: proyectos.nombre,
        total: sql<number>`count(*)`,
      })
      .from(asignaciones)
      .innerJoin(proyectos, eq(asignaciones.proyectoId, proyectos.id))
      .where(and(inArray(asignaciones.usuarioId, teamIds), isNull(asignaciones.deletedAt)))
      .groupBy(proyectos.id, proyectos.nombre),
    db
      .select({
        fecha: timetracking.fecha,
        total: sql<number>`coalesce(sum(${timetracking.horas}), 0)`,
      })
      .from(timetracking)
      .where(and(inArray(timetracking.usuarioId, teamIds), gte(timetracking.fecha, weekDates[0])))
      .groupBy(timetracking.fecha),
    db
      .select({
        usuarioId: asignaciones.usuarioId,
        dedicacion: sql<number>`coalesce(sum(${asignaciones.dedicacionPorcentaje}), 0)`,
        proyectosActivos: sql<number>`count(distinct ${asignaciones.proyectoId})`,
      })
      .from(asignaciones)
      .where(and(inArray(asignaciones.usuarioId, teamIds), isNull(asignaciones.deletedAt)))
      .groupBy(asignaciones.usuarioId),
    db
      .select({
        usuarioId: timetracking.usuarioId,
        horas: sql<number>`coalesce(sum(${timetracking.horas}), 0)`,
      })
      .from(timetracking)
      .where(and(inArray(timetracking.usuarioId, teamIds), eq(timetracking.estado, 'PENDIENTE')))
      .groupBy(timetracking.usuarioId),
    db
      .select({
        registroId: timetracking.id,
        usuarioId: timetracking.usuarioId,
        proyectoId: timetracking.proyectoId,
        fecha: timetracking.fecha,
        horas: timetracking.horas,
      })
      .from(timetracking)
      .innerJoin(users, eq(timetracking.usuarioId, users.id))
      .where(and(eq(users.managerId, user.id), eq(timetracking.estado, 'PENDIENTE')))
      .orderBy(desc(timetracking.fecha))
      .limit(MAX_ACTIVITY_ITEMS),
  ]);

  const ocupacionMap = new Map<string, { dedicacion: number; proyectosActivos: number }>();
  ocupacionRows.forEach((row) => {
    ocupacionMap.set(row.usuarioId, {
      dedicacion: toNumber(row.dedicacion, 0),
      proyectosActivos: toNumber(row.proyectosActivos, 0),
    });
  });

  const pendientesMap = new Map<string, number>();
  pendientesHorasRows.forEach((row) => {
    pendientesMap.set(row.usuarioId, toNumber(row.horas, 0));
  });

  const equipoOcupacion = teamMembers.map((member) => {
    const ocupacion = ocupacionMap.get(member.id);
    const horasPendientes = pendientesMap.get(member.id) ?? 0;
    return {
      usuarioId: member.id,
      nombre: formatNombreCompleto(member.nombre, member.apellidos),
      ocupacion: ocupacion?.dedicacion ?? 0,
      proyectosActivos: ocupacion?.proyectosActivos ?? 0,
      horasPendientes,
    };
  });

  const horasSemanaMap = new Map<string, number>();
  horasSemanaRows.forEach((row) => {
    horasSemanaMap.set(String(row.fecha), toNumber(row.total, 0));
  });
  const horasEquipoSemana = weekDates.map((fecha) => ({
    fecha,
    value: horasSemanaMap.get(fecha) ?? 0,
  }));

  const cargaPromedio =
    equipoOcupacion.reduce((sum, item) => sum + item.ocupacion, 0) / Math.max(equipoOcupacion.length, 1);

  return c.json({
    kpis: {
      miembrosEquipo: teamMembers.length,
      cargaPromedio: Number(cargaPromedio.toFixed(2)),
      horasPendientesAprobar: toNumber(pendientesRow[0]?.total, 0),
      proyectosActivos: toNumber(proyectosActivosRow[0]?.count, 0),
    },
    charts: {
      equipoPorProyecto: equipoPorProyectoRows.map((row) => ({
        id: row.proyectoId,
        label: row.nombre,
        value: toNumber(row.total, 0),
      })),
      horasEquipoSemana,
    },
    sections: {
      equipoOcupacion,
      pendientesAprobacion: pendientesAprobacionRows.map((row) => ({
        registroId: row.registroId,
        usuarioId: row.usuarioId,
        proyectoId: row.proyectoId,
        fecha: row.fecha,
        horas: toNumber(row.horas, 0),
      })),
    },
  });
});

dashboardRoutes.get('/empleado', async (c) => {
  const user = c.get('user') as User;
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

  return c.json({
    kpis: {
      horasMes: toNumber(horasMesRow[0]?.total, 0),
      proyectosActivos: toNumber(proyectosActivosRow[0]?.count, 0),
      ocupacion: toNumber(ocupacionRow[0]?.total, 0),
      tareasPendientes: toNumber(tareasPendientesRow[0]?.count, 0),
    },
    charts: {
      horasPorEstado: horasPorEstadoRows.map((row) => ({
        id: row.estado,
        label: row.estado,
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
  });
});
