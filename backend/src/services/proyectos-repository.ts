import { and, count, eq, getTableColumns, gte, isNull, lte } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  asignaciones,
  proyectos,
  proyectosDepartamentos,
  type NewAsignacion,
  type NewProyecto,
  type NewProyectosDepartamento,
} from '../db/schema/proyectos.js';

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
  return db
    .select({
      ...getTableColumns(proyectos),
      asignacionesActivas: count(asignaciones.id),
    })
    .from(proyectos)
    .leftJoin(
      asignaciones,
      and(eq(asignaciones.proyectoId, proyectos.id), isNull(asignaciones.deletedAt))
    )
    .where(whereClause)
    .groupBy(proyectos.id);
};

export const findProyectoById = async (id: string) => {
  const result = await db.select().from(proyectos).where(eq(proyectos.id, id)).limit(1);
  return result[0] ?? null;
};

/**
 * Busca un proyecto activo (no eliminado) por su código.
 * Excluye proyectos con soft-delete para permitir reutilización del código.
 * @param codigo - Código único del proyecto.
 * @returns Proyecto activo o null si no existe o fue eliminado.
 */
export const findProyectoByCodigo = async (codigo: string) => {
  const result = await db
    .select()
    .from(proyectos)
    .where(and(eq(proyectos.codigo, codigo), isNull(proyectos.deletedAt)))
    .limit(1);
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

// ============================================================================
// Departamentos por proyecto (N:M)
// ============================================================================

/**
 * Obtiene los IDs de departamentos asociados a un proyecto.
 * @param proyectoId - UUID del proyecto.
 * @returns Array de UUIDs de departamentos.
 */
export const getDepartamentosForProyecto = async (proyectoId: string): Promise<string[]> => {
  const rows = await db
    .select({ departamentoId: proyectosDepartamentos.departamentoId })
    .from(proyectosDepartamentos)
    .where(eq(proyectosDepartamentos.proyectoId, proyectoId));
  return rows.map((r) => r.departamentoId);
};

/**
 * Reemplaza la lista completa de departamentos asociados a un proyecto.
 * Elimina los registros existentes e inserta los nuevos en una sola operación.
 * @param proyectoId - UUID del proyecto.
 * @param departamentoIds - Lista de UUIDs de departamentos a asociar.
 */
export const setDepartamentosForProyecto = async (
  proyectoId: string,
  departamentoIds: string[]
): Promise<void> => {
  await db
    .delete(proyectosDepartamentos)
    .where(eq(proyectosDepartamentos.proyectoId, proyectoId));
  if (departamentoIds.length > 0) {
    const rows: NewProyectosDepartamento[] = departamentoIds.map((departamentoId) => ({
      proyectoId,
      departamentoId,
    }));
    await db.insert(proyectosDepartamentos).values(rows);
  }
};

/**
 * Obtiene un proyecto junto con sus departamentos asociados.
 * @param id - UUID del proyecto.
 * @returns Proyecto con `departamentoIds: string[]`, o null si no existe.
 */
export const findProyectoWithDepartamentos = async (id: string) => {
  const proyecto = await findProyectoById(id);
  if (!proyecto) return null;
  const departamentoIds = await getDepartamentosForProyecto(id);
  return { ...proyecto, departamentoIds };
};
