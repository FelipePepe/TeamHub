import { and, eq, gte, lte } from 'drizzle-orm';
import { db } from '../db/index.js';
import { asignaciones, proyectos, type NewAsignacion, type NewProyecto } from '../db/schema/proyectos.js';

type ProyectoFilters = {
  estado?: string;
  managerId?: string;
  cliente?: string;
  fechaInicio?: string;
  fechaFin?: string;
};

export const listProyectos = async (filters: ProyectoFilters = {}) => {
  const clauses = [];
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
  const query = db.select().from(proyectos);
  if (clauses.length) {
    return query.where(and(...clauses));
  }
  return query;
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
  return db.select().from(asignaciones).where(eq(asignaciones.proyectoId, proyectoId));
};

export const listAsignacionesByUsuarioId = async (usuarioId: string) => {
  return db.select().from(asignaciones).where(eq(asignaciones.usuarioId, usuarioId));
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
