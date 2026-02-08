import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  plantillasOnboarding,
  tareasPlantilla,
  type NewPlantillaOnboarding,
  type NewTareaPlantilla,
} from '../db/schema/plantillas.js';

export const listPlantillas = async (filters?: {
  departamentoId?: string;
  activo?: boolean;
}) => {
  const clauses = [];
  if (filters?.departamentoId) {
    clauses.push(eq(plantillasOnboarding.departamentoId, filters.departamentoId));
  }
  if (filters?.activo === undefined) {
    clauses.push(isNull(plantillasOnboarding.deletedAt));
  } else {
    clauses.push(
      filters.activo ? isNull(plantillasOnboarding.deletedAt) : isNotNull(plantillasOnboarding.deletedAt)
    );
  }
  const query = db.select().from(plantillasOnboarding);
  if (clauses.length) {
    return query.where(and(...clauses));
  }
  return query;
};

export const findPlantillaById = async (id: string) => {
  const result = await db
    .select()
    .from(plantillasOnboarding)
    .where(eq(plantillasOnboarding.id, id))
    .limit(1);
  return result[0] ?? null;
};

export const createPlantilla = async (payload: NewPlantillaOnboarding) => {
  const result = await db.insert(plantillasOnboarding).values(payload).returning();
  return result[0] ?? null;
};

export const updatePlantillaById = async (
  id: string,
  payload: Partial<NewPlantillaOnboarding>
) => {
  const result = await db
    .update(plantillasOnboarding)
    .set(payload)
    .where(eq(plantillasOnboarding.id, id))
    .returning();
  return result[0] ?? null;
};

export const listTareasByPlantillaId = async (plantillaId: string) => {
  return db
    .select()
    .from(tareasPlantilla)
    .where(eq(tareasPlantilla.plantillaId, plantillaId));
};

export const findTareaById = async (id: string) => {
  const result = await db
    .select()
    .from(tareasPlantilla)
    .where(eq(tareasPlantilla.id, id))
    .limit(1);
  return result[0] ?? null;
};

export const createTareaPlantilla = async (payload: NewTareaPlantilla) => {
  const result = await db.insert(tareasPlantilla).values(payload).returning();
  return result[0] ?? null;
};

export const updateTareaPlantillaById = async (
  id: string,
  payload: Partial<NewTareaPlantilla>
) => {
  const result = await db
    .update(tareasPlantilla)
    .set(payload)
    .where(eq(tareasPlantilla.id, id))
    .returning();
  return result[0] ?? null;
};

export const deleteTareaPlantillaById = async (id: string) => {
  await db.delete(tareasPlantilla).where(eq(tareasPlantilla.id, id));
};
