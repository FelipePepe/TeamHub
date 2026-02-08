import { and, eq, gte, isNull, lte } from 'drizzle-orm';
import { db } from '../db/index.js';
import { asignaciones, proyectos, type NewAsignacion, type NewProyecto } from '../db/schema/proyectos.js';

type ProjectStatus = 'PLANIFICACION' | 'ACTIVO' | 'PAUSADO' | 'COMPLETADO' | 'CANCELADO';

type ProyectoFilters = {
  estado?: ProjectStatus;
  managerId?: string;
  cliente?: string;
  fechaInicio?: string;
  fechaFin?: string;
};

export const listProyectos = async (filters: ProyectoFilters = {}) => {
  const clauses = [isNull(proyectos.deletedAt)];
  if (filters.estado) {
    clauses.push(eq(proyectos.estado, filters.estado));
  }
  if (filters.managerId) {
    clauses.push(eq(proyectos.managerId, filters.managerId));
  }
  if (filters.cliente) {
    clauses.push(eq(proyectos.cliente, filters.cliente));
  }
  if (filters.fechaInicio) {
    clauses.push(gte(proyectos.fechaInicio, filters.fechaInicio));
  }
  if (filters.fechaFin) {
    clauses.push(lte(proyectos.fechaInicio, filters.fechaFin));
  }
  const whereClause = clauses.length ? and(...clauses) : undefined;
  if (whereClause) {
    return db.select().from(proyectos).where(whereClause);
  }
  return db.select().from(proyectos);
};

export const findProyectoById = async (id: string) => {
  const result = await db.select().from(proyectos).where(eq(proyectos.id, id)).limit(1);
  return result[0] ?? null;
};

export const findProyectoByCodigo = async (codigo: string) => {
  const result = await db.select().from(proyectos).where(eq(proyectos.codigo, codigo)).limit(1);
  return result[0] ?? null;
};

export const createProyecto = async (payload: NewProyecto) => {
  const result = await db.insert(proyectos).values(payload).returning();
  return result[0] ?? null;
};

export const updateProyectoById = async (id: string, payload: Partial<NewProyecto>) => {
  const result = await db
    .update(proyectos)
    .set(payload)
    .where(eq(proyectos.id, id))
    .returning();
  return result[0] ?? null;
};

export const listAsignacionesByProyectoId = async (proyectoId: string) => {
  return db
    .select()
    .from(asignaciones)
    .where(and(eq(asignaciones.proyectoId, proyectoId), isNull(asignaciones.deletedAt)));
};

export const listAsignacionesByUsuarioId = async (usuarioId: string) => {
  return db
    .select()
    .from(asignaciones)
    .where(and(eq(asignaciones.usuarioId, usuarioId), isNull(asignaciones.deletedAt)));
};

export const findAsignacionById = async (id: string) => {
  const result = await db.select().from(asignaciones).where(eq(asignaciones.id, id)).limit(1);
  return result[0] ?? null;
};

export const createAsignacion = async (payload: NewAsignacion) => {
  const result = await db.insert(asignaciones).values(payload).returning();
  return result[0] ?? null;
};

export const updateAsignacionById = async (id: string, payload: Partial<NewAsignacion>) => {
  const result = await db
    .update(asignaciones)
    .set(payload)
    .where(eq(asignaciones.id, id))
    .returning();
  return result[0] ?? null;
};
