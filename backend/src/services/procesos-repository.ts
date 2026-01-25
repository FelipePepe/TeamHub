import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  procesosOnboarding,
  tareasOnboarding,
  type NewProcesoOnboarding,
  type NewTareaOnboarding,
} from '../db/schema/procesos.js';

export const listProcesos = async (filters?: {
  estado?: string;
  empleadoId?: string;
}) => {
  const clauses = [];
  if (filters?.estado) {
    clauses.push(eq(procesosOnboarding.estado, filters.estado));
  }
  if (filters?.empleadoId) {
    clauses.push(eq(procesosOnboarding.empleadoId, filters.empleadoId));
  }
  const query = db.select().from(procesosOnboarding);
  if (clauses.length) {
    return query.where(and(...clauses));
  }
  return query;
};

export const findProcesoById = async (id: string) => {
  const result = await db
    .select()
    .from(procesosOnboarding)
    .where(eq(procesosOnboarding.id, id))
    .limit(1);
  return result[0] ?? null;
};

export const createProceso = async (payload: NewProcesoOnboarding) => {
  const result = await db.insert(procesosOnboarding).values(payload).returning();
  return result[0] ?? null;
};

export const updateProcesoById = async (id: string, payload: Partial<NewProcesoOnboarding>) => {
  const result = await db
    .update(procesosOnboarding)
    .set(payload)
    .where(eq(procesosOnboarding.id, id))
    .returning();
  return result[0] ?? null;
};

export const listTareasByProcesoId = async (procesoId: string) => {
  return db
    .select()
    .from(tareasOnboarding)
    .where(eq(tareasOnboarding.procesoId, procesoId));
};

export const findTareaOnboardingById = async (id: string) => {
  const result = await db
    .select()
    .from(tareasOnboarding)
    .where(eq(tareasOnboarding.id, id))
    .limit(1);
  return result[0] ?? null;
};

export const createTareasOnboarding = async (payload: NewTareaOnboarding[]) => {
  if (!payload.length) return [];
  return db.insert(tareasOnboarding).values(payload).returning();
};

export const updateTareaOnboardingById = async (
  id: string,
  payload: Partial<NewTareaOnboarding>
) => {
  const result = await db
    .update(tareasOnboarding)
    .set(payload)
    .where(eq(tareasOnboarding.id, id))
    .returning();
  return result[0] ?? null;
};

export const updateTareasOrden = async (procesoId: string, orderedIds: string[]) => {
  if (!orderedIds.length) return;
  await db.transaction(async (tx) => {
    await Promise.all(
      orderedIds.map((id, index) =>
        tx
          .update(tareasOnboarding)
          .set({ orden: index + 1, updatedAt: new Date() })
          .where(and(eq(tareasOnboarding.id, id), eq(tareasOnboarding.procesoId, procesoId)))
      )
    );
  });
};

export const listTareasByIds = async (ids: string[]) => {
  if (!ids.length) return [];
  return db.select().from(tareasOnboarding).where(inArray(tareasOnboarding.id, ids));
};
