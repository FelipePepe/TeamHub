import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { tareas, type Tarea, type NuevaTarea } from '../db/schema/tareas.js';

export class TareasRepository {
  /**
   * Obtener todas las tareas de un proyecto (activas)
   */
  async findByProyecto(proyectoId: string): Promise<Tarea[]> {
    return db
      .select()
      .from(tareas)
      .where(and(eq(tareas.proyectoId, proyectoId), isNull(tareas.deletedAt)))
      .orderBy(tareas.orden, tareas.createdAt);
  }

  /**
   * Obtener todas las tareas asignadas a un usuario
   */
  async findByUsuario(usuarioId: string): Promise<Tarea[]> {
    return db
      .select()
      .from(tareas)
      .where(and(eq(tareas.usuarioAsignadoId, usuarioId), isNull(tareas.deletedAt)))
      .orderBy(desc(tareas.createdAt));
  }

  /**
   * Obtener una tarea por ID
   */
  async findById(id: string): Promise<Tarea | undefined> {
    const result = await db
      .select()
      .from(tareas)
      .where(and(eq(tareas.id, id), isNull(tareas.deletedAt)))
      .limit(1);
    return result[0];
  }

  /**
   * Obtener el siguiente valor de orden para un proyecto
   */
  async getNextOrden(proyectoId: string): Promise<number> {
    const result = await db
      .select({ maxOrden: sql<string>`coalesce(max(${tareas.orden}), '-1')` })
      .from(tareas)
      .where(and(eq(tareas.proyectoId, proyectoId), isNull(tareas.deletedAt)));
    return parseInt(result[0].maxOrden, 10) + 1;
  }

  /**
   * Crear nueva tarea
   */
  async create(data: NuevaTarea): Promise<Tarea> {
    const result = await db.insert(tareas).values(data).returning();
    return result[0];
  }

  /**
   * Actualizar tarea existente
   */
  async update(id: string, data: Partial<NuevaTarea>): Promise<Tarea | undefined> {
    const result = await db
      .update(tareas)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(tareas.id, id), isNull(tareas.deletedAt)))
      .returning();
    return result[0];
  }

  /**
   * Soft delete de tarea
   */
  async delete(id: string): Promise<boolean> {
    const result = await db
      .update(tareas)
      .set({ deletedAt: new Date() })
      .where(and(eq(tareas.id, id), isNull(tareas.deletedAt)))
      .returning();
    return result.length > 0;
  }

  /**
   * Obtener tareas que dependen de una tarea específica
   */
  async findDependientes(tareaId: string): Promise<Tarea[]> {
    return db
      .select()
      .from(tareas)
      .where(and(eq(tareas.dependeDe, tareaId), isNull(tareas.deletedAt)));
  }

  /**
   * Actualizar estado de tarea
   */
  async updateEstado(
    id: string,
    estado: Tarea['estado']
  ): Promise<Tarea | undefined> {
    const result = await db
      .update(tareas)
      .set({ estado, updatedAt: new Date() })
      .where(and(eq(tareas.id, id), isNull(tareas.deletedAt)))
      .returning();
    return result[0];
  }

  /**
   * Reasignar tarea a otro usuario
   */
  async reasignar(id: string, usuarioId: string | null): Promise<Tarea | undefined> {
    const result = await db
      .update(tareas)
      .set({ usuarioAsignadoId: usuarioId, updatedAt: new Date() })
      .where(and(eq(tareas.id, id), isNull(tareas.deletedAt)))
      .returning();
    return result[0];
  }
}

export const tareasRepository = new TareasRepository();
