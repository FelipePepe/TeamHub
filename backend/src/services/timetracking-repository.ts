import { and, eq, gte, lte } from 'drizzle-orm';
import { db } from '../db/index.js';
import { timetracking, type NewTimetracking } from '../db/schema/timetracking.js';

type TimeEntryStatus = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

type TimetrackingFilters = {
  usuarioId?: string;
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
  if (filters.usuarioId) {
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
  const baseQuery = whereClause
    ? db.select().from(timetracking).where(whereClause)
    : db.select().from(timetracking);

  if (pagination?.page && pagination.limit) {
    return baseQuery.limit(pagination.limit).offset((pagination.page - 1) * pagination.limit);
  }
  return baseQuery;
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
