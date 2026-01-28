import { and, eq, ne, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import { departamentos, type NewDepartamento } from '../db/schema/departamentos.js';

export const findDepartamentoById = async (id: string) => {
  const result = await db.select().from(departamentos).where(eq(departamentos.id, id)).limit(1);
  return result[0] ?? null;
};

export const findDepartamentoByNombreOrCodigo = async (nombre?: string, codigo?: string) => {
  if (!nombre && !codigo) return null;
  const clauses = [];
  if (nombre) clauses.push(eq(departamentos.nombre, nombre));
  if (codigo) clauses.push(eq(departamentos.codigo, codigo));
  const result = await db.select().from(departamentos).where(or(...clauses)).limit(1);
  return result[0] ?? null;
};

export const findDepartamentoByNombreOrCodigoExcludingId = async (
  nombre: string | undefined,
  codigo: string | undefined,
  id: string
) => {
  if (!nombre && !codigo) return null;
  const clauses = [];
  if (nombre) clauses.push(eq(departamentos.nombre, nombre));
  if (codigo) clauses.push(eq(departamentos.codigo, codigo));
  const result = await db
    .select()
    .from(departamentos)
    .where(and(or(...clauses), ne(departamentos.id, id)))
    .limit(1);
  return result[0] ?? null;
};

export const createDepartamento = async (payload: NewDepartamento) => {
  const result = await db.insert(departamentos).values(payload).returning();
  return result[0] ?? null;
};

export const updateDepartamentoById = async (
  id: string,
  payload: Partial<NewDepartamento>
) => {
  const result = await db
    .update(departamentos)
    .set(payload)
    .where(eq(departamentos.id, id))
    .returning();
  return result[0] ?? null;
};
