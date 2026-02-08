import { and, desc, eq, gte, inArray, isNull, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { asignaciones, proyectos } from '../../db/schema/proyectos.js';
import { timetracking } from '../../db/schema/timetracking.js';
import { users } from '../../db/schema/users.js';
import type { User } from '../../db/schema/users.js';
import { DAYS_WEEK, MAX_ACTIVITY_ITEMS } from './constants.js';
import { formatNombreCompleto, getRecentDates, toNumber } from './utils.js';

export const buildManagerDashboardResponse = async (user: User) => {
  const now = new Date();
  const weekDates = getRecentDates(DAYS_WEEK, now);

  const teamMembers = await db
    .select({ id: users.id, nombre: users.nombre, apellidos: users.apellidos })
    .from(users)
    .where(and(eq(users.managerId, user.id), isNull(users.deletedAt)));

  const teamIds = teamMembers.map((member) => member.id);
  if (!teamIds.length) {
    return {
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
    };
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
        usuarioNombre: users.nombre,
        usuarioApellidos: users.apellidos,
        proyectoId: timetracking.proyectoId,
        proyectoNombre: proyectos.nombre,
        fecha: timetracking.fecha,
        horas: timetracking.horas,
      })
      .from(timetracking)
      .innerJoin(users, eq(timetracking.usuarioId, users.id))
      .leftJoin(proyectos, eq(timetracking.proyectoId, proyectos.id))
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

  return {
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
        usuarioNombre: formatNombreCompleto(row.usuarioNombre, row.usuarioApellidos),
        proyectoNombre: row.proyectoNombre ?? 'Sin proyecto',
        fecha: row.fecha,
        horas: toNumber(row.horas, 0),
      })),
    },
  };
};
