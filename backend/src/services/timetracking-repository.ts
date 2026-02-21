import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { timetracking, type NewTimetracking } from '../db/schema/timetracking.js';
import { users } from '../db/schema/users.js';

type TimeEntryStatus = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

type TimetrackingFilters = {
  usuarioId?: string;
  /** Filtra por varios usuarioIds a la vez (tiene precedencia sobre usuarioId). */
  usuarioIds?: string[];
  proyectoId?: string;
  estado?: TimeEntryStatus;
  fechaInicio?: string;
  fechaFin?: string;
  facturable?: boolean;
};

export const listTimetracking = async (
  filters: TimetrackingFilters = {},
  pagination?: { page?: number; limit?: number }
) => {
  const clauses = [];

  if (filters.usuarioIds && filters.usuarioIds.length > 0) {
    clauses.push(inArray(timetracking.usuarioId, filters.usuarioIds));
  } else if (filters.usuarioId) {
    clauses.push(eq(timetracking.usuarioId, filters.usuarioId));
  }
  if (filters.proyectoId) {
    clauses.push(eq(timetracking.proyectoId, filters.proyectoId));
  }
  if (filters.estado) {
    clauses.push(eq(timetracking.estado, filters.estado));
  }
  if (filters.facturable !== undefined) {
    clauses.push(eq(timetracking.facturable, filters.facturable));
  }
  if (filters.fechaInicio) {
    clauses.push(gte(timetracking.fecha, filters.fechaInicio));
  }
  if (filters.fechaFin) {
    clauses.push(lte(timetracking.fecha, filters.fechaFin));
  }

  const whereClause = clauses.length ? and(...clauses) : undefined;
  const baseQuery = db
    .select({
      id: timetracking.id,
      usuarioId: timetracking.usuarioId,
      proyectoId: timetracking.proyectoId,
      fecha: timetracking.fecha,
      horas: timetracking.horas,
      descripcion: timetracking.descripcion,
      facturable: timetracking.facturable,
      estado: timetracking.estado,
      aprobadoPor: timetracking.aprobadoPor,
      aprobadoAt: timetracking.aprobadoAt,
      rechazadoPor: timetracking.rechazadoPor,
      rechazadoAt: timetracking.rechazadoAt,
      comentarioRechazo: timetracking.comentarioRechazo,
      createdAt: timetracking.createdAt,
      updatedAt: timetracking.updatedAt,
      /** Nombre completo del empleado obtenido via LEFT JOIN con users. */
      usuarioNombre: sql<string | null>`NULLIF(TRIM(COALESCE(${users.nombre}, '') || ' ' || COALESCE(${users.apellidos}, '')), '')`,
    })
    .from(timetracking)
    .leftJoin(users, eq(timetracking.usuarioId, users.id));

  const filteredQuery = whereClause ? baseQuery.where(whereClause) : baseQuery;

  if (pagination?.page && pagination.limit) {
    return filteredQuery.limit(pagination.limit).offset((pagination.page - 1) * pagination.limit);
  }
  return filteredQuery;
};

export const findTimetrackingById = async (id: string) => {
  const result = await db.select().from(timetracking).where(eq(timetracking.id, id)).limit(1);
  return result[0] ?? null;
};

export const createTimetracking = async (payload: NewTimetracking) => {
  const result = await db.insert(timetracking).values(payload).returning();
  return result[0] ?? null;
};

export const updateTimetrackingById = async (id: string, payload: Partial<NewTimetracking>) => {
  const result = await db
    .update(timetracking)
    .set(payload)
    .where(eq(timetracking.id, id))
    .returning();
  return result[0] ?? null;
};

export const deleteTimetrackingById = async (id: string) => {
  await db.delete(timetracking).where(eq(timetracking.id, id));
};
