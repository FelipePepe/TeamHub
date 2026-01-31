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
  fechaInicio?: string | Date | null;
  fechaFin?: string | Date | null;
  horasEstimadas?: number | string | null;
  horasReales?: number | string | null;
  orden?: number | string | null;
  dependeDe?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export const toTareaResponse = (tarea: TareaResponseInput | Tarea) => ({
  id: tarea.id,
  proyectoId: tarea.proyectoId,
  titulo: tarea.titulo,
  descripcion: tarea.descripcion,
  estado: tarea.estado,
  prioridad: tarea.prioridad,
  usuarioAsignadoId: tarea.usuarioAsignadoId,
  fechaInicio: tarea.fechaInicio,
  fechaFin: tarea.fechaFin,
  horasEstimadas: toNumberOrUndefined(tarea.horasEstimadas),
  horasReales: toNumberOrUndefined(tarea.horasReales),
  orden: toNumberOrUndefined(tarea.orden),
  dependeDe: tarea.dependeDe,
  createdAt: tarea.createdAt,
  updatedAt: tarea.updatedAt,
});
