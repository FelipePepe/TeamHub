import { eq, and, isNull, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { tareas, type Tarea, type NuevaTarea } from '../db/schema/tareas.js';
import { users } from '../db/schema/users.js';

/** Tarea enriquecida con los datos básicos del usuario asignado (nombre, apellidos) */
export type TareaConUsuario = Tarea & {
  usuarioAsignado: { id: string; nombre: string; apellidos: string | null } | null;
};

/**
 * Transforma filas del JOIN tarea+usuario al tipo enriquecido TareaConUsuario.
 * @param rows - Resultado de la query con LEFT JOIN a users
 * @returns Array de tareas con el objeto `usuarioAsignado` embebido
 */
function mapRowsToTareaConUsuario(
  rows: { tarea: Tarea; usuario: { id: string; nombre: string; apellidos: string | null } | null }[]
): TareaConUsuario[] {
  return rows.map((row) => ({
    ...row.tarea,
    usuarioAsignado: row.usuario,
  }));
}

export class TareasRepository {
  /**
   * Obtener todas las tareas activas de un proyecto con datos del usuario asignado.
   * Realiza LEFT JOIN con la tabla users para incluir nombre y apellidos.
   * @param proyectoId - UUID del proyecto
   * @returns Tareas ordenadas por orden y fecha de creación, con `usuarioAsignado` embebido
   */
  async findByProyecto(proyectoId: string): Promise<TareaConUsuario[]> {
    const rows = await db
      .select({
        tarea: tareas,
        usuario: {
          id: users.id,
          nombre: users.nombre,
          apellidos: users.apellidos,
        },
      })
      .from(tareas)
      .leftJoin(users, eq(tareas.usuarioAsignadoId, users.id))
      .where(and(eq(tareas.proyectoId, proyectoId), isNull(tareas.deletedAt)))
      .orderBy(tareas.orden, tareas.createdAt);
    return mapRowsToTareaConUsuario(rows);
  }

  /**
   * Obtener todas las tareas asignadas a un usuario con datos del usuario asignado.
   * Realiza LEFT JOIN con la tabla users para incluir nombre y apellidos.
   * @param usuarioId - UUID del usuario asignado
   * @returns Tareas ordenadas por fecha de creación descendente, con `usuarioAsignado` embebido
   */
  async findByUsuario(usuarioId: string): Promise<TareaConUsuario[]> {
    const rows = await db
      .select({
        tarea: tareas,
        usuario: {
          id: users.id,
          nombre: users.nombre,
          apellidos: users.apellidos,
        },
      })
      .from(tareas)
      .leftJoin(users, eq(tareas.usuarioAsignadoId, users.id))
      .where(and(eq(tareas.usuarioAsignadoId, usuarioId), isNull(tareas.deletedAt)))
      .orderBy(desc(tareas.createdAt));
    return mapRowsToTareaConUsuario(rows);
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
