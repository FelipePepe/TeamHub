import { HTTPException } from 'hono/http-exception';
import { tareasRepository } from './tareas-repository.js';
import { findProyectoById } from './proyectos-repository.js';
import { findActiveUserById } from './users-repository.js';
import type { Tarea, NuevaTarea, EstadoTarea } from '../db/schema/tareas.js';
import type { User } from '../db/schema/users.js';
import {
  assertEstadoTransition,
  assertPrivileged,
  buildUpdatePayload,
  type TareaUpdateInput,
} from './tareas/helpers.js';

/**
 * Servicio de lógica de negocio para tareas
 */
export class TareasService {
  /**
   * Listar tareas de un proyecto
   */
  async listByProyecto(proyectoId: string, _user: User): Promise<Tarea[]> {
    const proyecto = await findProyectoById(proyectoId);
    if (!proyecto) {
      throw new HTTPException(404, { message: 'Proyecto no encontrado' });
    }
    return tareasRepository.findByProyecto(proyectoId);
  }

  /**
   * Listar tareas asignadas a un usuario
   */
  async listByUsuario(usuarioId: string, requestingUser: User): Promise<Tarea[]> {
    // Solo ADMIN, RRHH, MANAGER pueden ver tareas de otros usuarios
    if (
      usuarioId !== requestingUser.id &&
      !['ADMIN', 'RRHH', 'MANAGER'].includes(requestingUser.rol)
    ) {
      throw new HTTPException(403, { message: 'No autorizado' });
    }

    const usuario = await findActiveUserById(usuarioId);
    if (!usuario) {
      throw new HTTPException(404, { message: 'Usuario no encontrado' });
    }

    return tareasRepository.findByUsuario(usuarioId);
  }

  /**
   * Obtener detalle de una tarea
   */
  async getById(id: string, _user: User): Promise<Tarea> {
    const tarea = await tareasRepository.findById(id);
    if (!tarea) {
      throw new HTTPException(404, { message: 'Tarea no encontrada' });
    }
    return tarea;
  }

  /**
   * Crear nueva tarea
   */
  async create(
    proyectoId: string,
    data: {
      titulo: string;
      descripcion?: string;
      estado?: EstadoTarea;
      prioridad?: typeof import('../db/schema/tareas.js').prioridadTareaEnum.enumValues[number];
      usuarioAsignadoId?: string;
      fechaInicio?: string;
      fechaFin?: string;
      horasEstimadas?: number;
      horasReales?: number;
      orden?: number;
      dependeDe?: string;
    },
    user: User
  ): Promise<Tarea> {
    // Verificar permisos: ADMIN, RRHH, MANAGER
    assertPrivileged(user);

    // Verificar que el proyecto existe
    const proyecto = await findProyectoById(proyectoId);
    if (!proyecto) {
      throw new HTTPException(404, { message: 'Proyecto no encontrado' });
    }

    // Verificar que el usuario asignado existe (si se proporciona)
    if (data.usuarioAsignadoId) {
      const usuario = await findActiveUserById(data.usuarioAsignadoId);
      if (!usuario) {
        throw new HTTPException(404, { message: 'Usuario asignado no encontrado' });
      }
    }

    // Verificar que la tarea de la que depende existe (si se proporciona)
    if (data.dependeDe) {
      const tareaDependencia = await tareasRepository.findById(data.dependeDe);
      if (!tareaDependencia) {
        throw new HTTPException(404, { message: 'Tarea de dependencia no encontrada' });
      }
      // Verificar que la dependencia es del mismo proyecto
      if (tareaDependencia.proyectoId !== proyectoId) {
        throw new HTTPException(400, {
          message: 'La tarea de dependencia debe pertenecer al mismo proyecto',
        });
      }
    }

    // Validar fechas
    if (data.fechaInicio && data.fechaFin) {
      const inicio = new Date(data.fechaInicio);
      const fin = new Date(data.fechaFin);
      if (fin < inicio) {
        throw new HTTPException(400, {
          message: 'La fecha de fin debe ser posterior a la fecha de inicio',
        });
      }
    }

    const now = new Date();
    const nuevaTarea: NuevaTarea = {
      ...data,
      proyectoId,
      fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : undefined,
      fechaFin: data.fechaFin ? new Date(data.fechaFin) : undefined,
      horasEstimadas: data.horasEstimadas?.toString(),
      horasReales: data.horasReales?.toString(),
      orden: data.orden?.toString() ?? '0',
      createdAt: now,
      updatedAt: now,
    };

    return tareasRepository.create(nuevaTarea);
  }

  /**
   * Actualizar tarea existente
   */
  async update(
    id: string,
    data: TareaUpdateInput,
    user: User
  ): Promise<Tarea> {
    // Verificar permisos: ADMIN, RRHH, MANAGER
    assertPrivileged(user);

    const tarea = await tareasRepository.findById(id);
    if (!tarea) {
      throw new HTTPException(404, { message: 'Tarea no encontrada' });
    }

    // Verificar que el usuario asignado existe (si se proporciona)
    if (data.usuarioAsignadoId) {
      const usuario = await findActiveUserById(data.usuarioAsignadoId);
      if (!usuario) {
        throw new HTTPException(404, { message: 'Usuario asignado no encontrado' });
      }
    }

    // Verificar que la tarea de la que depende existe (si se proporciona)
    if (data.dependeDe) {
      const tareaDependencia = await tareasRepository.findById(data.dependeDe);
      if (!tareaDependencia) {
        throw new HTTPException(404, { message: 'Tarea de dependencia no encontrada' });
      }
      // Verificar que la dependencia es del mismo proyecto
      if (tareaDependencia.proyectoId !== tarea.proyectoId) {
        throw new HTTPException(400, {
          message: 'La tarea de dependencia debe pertenecer al mismo proyecto',
        });
      }
      // Prevenir dependencias circulares
      if (data.dependeDe === id) {
        throw new HTTPException(400, {
          message: 'Una tarea no puede depender de sí misma',
        });
      }
    }

    // Validar fechas
    const fechaInicio = data.fechaInicio ? new Date(data.fechaInicio) : null;
    const fechaFin = data.fechaFin ? new Date(data.fechaFin) : null;
    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      throw new HTTPException(400, {
        message: 'La fecha de fin debe ser posterior a la fecha de inicio',
      });
    }

    const updates = buildUpdatePayload(data);

    const updated = await tareasRepository.update(id, updates);
    if (!updated) {
      throw new HTTPException(404, { message: 'Tarea no encontrada' });
    }

    return updated;
  }

  /**
   * Eliminar tarea (soft delete)
   */
  async delete(id: string, user: User): Promise<void> {
    // Verificar permisos: ADMIN, RRHH, MANAGER
    assertPrivileged(user);

    const tarea = await tareasRepository.findById(id);
    if (!tarea) {
      throw new HTTPException(404, { message: 'Tarea no encontrada' });
    }

    // Verificar si hay tareas dependientes
    const dependientes = await tareasRepository.findDependientes(id);
    if (dependientes.length > 0) {
      throw new HTTPException(400, {
        message: 'No se puede eliminar una tarea con tareas dependientes',
      });
    }

    const deleted = await tareasRepository.delete(id);
    if (!deleted) {
      throw new HTTPException(404, { message: 'Tarea no encontrada' });
    }
  }

  /**
   * Actualizar estado de tarea
   */
  async updateEstado(id: string, estado: EstadoTarea, user: User): Promise<Tarea> {
    // Verificar permisos: ADMIN, RRHH, MANAGER pueden cambiar cualquier estado
    // Los usuarios asignados pueden cambiar su propia tarea
    const tarea = await tareasRepository.findById(id);
    if (!tarea) {
      throw new HTTPException(404, { message: 'Tarea no encontrada' });
    }

    if (
      !['ADMIN', 'RRHH', 'MANAGER'].includes(user.rol) &&
      tarea.usuarioAsignadoId !== user.id
    ) {
      throw new HTTPException(403, { message: 'No autorizado' });
    }

    // Validar transiciones de estado
    assertEstadoTransition(tarea.estado, estado);

    const updated = await tareasRepository.updateEstado(id, estado);
    if (!updated) {
      throw new HTTPException(404, { message: 'Tarea no encontrada' });
    }

    return updated;
  }

  /**
   * Reasignar tarea a otro usuario
   */
  async reasignar(id: string, usuarioId: string | null, user: User): Promise<Tarea> {
    // Verificar permisos: ADMIN, RRHH, MANAGER
    assertPrivileged(user);

    const tarea = await tareasRepository.findById(id);
    if (!tarea) {
      throw new HTTPException(404, { message: 'Tarea no encontrada' });
    }

    // Verificar que el nuevo usuario existe (si se proporciona)
    if (usuarioId) {
      const usuario = await findActiveUserById(usuarioId);
      if (!usuario) {
        throw new HTTPException(404, { message: 'Usuario no encontrado' });
      }
    }

    const updated = await tareasRepository.reasignar(id, usuarioId);
    if (!updated) {
      throw new HTTPException(404, { message: 'Tarea no encontrada' });
    }

    return updated;
  }
}

export const tareasService = new TareasService();
