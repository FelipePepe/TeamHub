import { HTTPException } from 'hono/http-exception';
import type { EstadoTarea } from '../db/schema/tareas.js';
import type { User } from '../db/schema/users.js';

const PRIVILEGED_ROLES: User['rol'][] = ['ADMIN', 'RRHH', 'MANAGER'];

export const assertPrivileged = (user: User) => {
  if (!PRIVILEGED_ROLES.includes(user.rol)) {
    throw new HTTPException(403, { message: 'No autorizado' });
  }
};

export type TareaUpdateInput = {
  titulo?: string;
  descripcion?: string | null;
  estado?: EstadoTarea;
  prioridad?: typeof import('../db/schema/tareas.js').prioridadTareaEnum.enumValues[number];
  usuarioAsignadoId?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  horasEstimadas?: number | null;
  horasReales?: number | null;
  orden?: number;
  dependeDe?: string | null;
};

export const buildUpdatePayload = (data: TareaUpdateInput) => {
  return {
    ...data,
    fechaInicio:
      data.fechaInicio !== undefined ? (data.fechaInicio ? new Date(data.fechaInicio) : null) : undefined,
    fechaFin:
      data.fechaFin !== undefined ? (data.fechaFin ? new Date(data.fechaFin) : null) : undefined,
    horasEstimadas:
      data.horasEstimadas !== undefined ? data.horasEstimadas?.toString() : undefined,
    horasReales: data.horasReales !== undefined ? data.horasReales?.toString() : undefined,
    orden: data.orden !== undefined ? data.orden?.toString() : undefined,
  };
};

export const assertEstadoTransition = (from: EstadoTarea, to: EstadoTarea) => {
  const validTransitions: Record<EstadoTarea, EstadoTarea[]> = {
    TODO: ['IN_PROGRESS', 'BLOCKED'],
    IN_PROGRESS: ['REVIEW', 'BLOCKED', 'TODO'],
    REVIEW: ['DONE', 'IN_PROGRESS'],
    DONE: ['IN_PROGRESS'],
    BLOCKED: ['TODO', 'IN_PROGRESS'],
  };

  if (!validTransitions[from].includes(to)) {
    throw new HTTPException(400, {
      message: `Transición de estado no válida: ${from} -> ${to}`,
    });
  }
};
