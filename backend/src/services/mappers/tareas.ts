import type { Tarea } from '../../db/schema/tareas.js';
import { toNumberOrUndefined } from './utils.js';

type TareaResponseInput = {
  id: string;
  proyectoId: string;
  titulo: string;
  descripcion?: string | null;
  estado: string;
  prioridad: string;
  usuarioAsignadoId?: string | null;
  usuarioAsignado?: { id: string; nombre: string; apellidos: string | null } | null;
  fechaInicio?: string | Date | null;
  fechaFin?: string | Date | null;
  horasEstimadas?: number | string | null;
  horasReales?: number | string | null;
  orden?: number | string | null;
  dependeDe?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

/**
 * Mapea una tarea del dominio/DB al formato de respuesta de la API.
 * Incluye `usuarioAsignado` con datos básicos del usuario (nombre, apellidos)
 * cuando la tarea viene enriquecida desde el repositorio (LEFT JOIN con users).
 * @param tarea - Tarea cruda o enriquecida con datos del usuario asignado
 * @returns Objeto de respuesta conforme al contrato OpenAPI TareaResponse
 */
export const toTareaResponse = (tarea: TareaResponseInput | (Tarea & { usuarioAsignado?: { id: string; nombre: string; apellidos: string | null } | null })) => ({
  id: tarea.id,
  proyectoId: tarea.proyectoId,
  titulo: tarea.titulo,
  descripcion: tarea.descripcion,
  estado: tarea.estado,
  prioridad: tarea.prioridad,
  usuarioAsignadoId: tarea.usuarioAsignadoId,
  usuarioAsignado: tarea.usuarioAsignado ?? null,
  fechaInicio: tarea.fechaInicio,
  fechaFin: tarea.fechaFin,
  horasEstimadas: toNumberOrUndefined(tarea.horasEstimadas),
  horasReales: toNumberOrUndefined(tarea.horasReales),
  orden: toNumberOrUndefined(tarea.orden),
  dependeDe: tarea.dependeDe,
  createdAt: tarea.createdAt,
  updatedAt: tarea.updatedAt,
});
