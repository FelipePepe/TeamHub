import type { Asignacion, Proyecto } from '../../store/index.js';
import { resolveActiveState, toNumberOrUndefined } from './utils.js';

type ProyectoResponseInput = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  codigo: string;
  cliente?: string | null;
  fechaInicio?: string | Date | null;
  fechaFinEstimada?: string | Date | null;
  fechaFinReal?: string | Date | null;
  estado: string;
  managerId: string;
  presupuestoHoras?: number | string | null;
  horasConsumidas?: number | string | null;
  prioridad?: string | null;
  color?: string | null;
  activo?: boolean;
  deletedAt?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type AsignacionResponseInput = {
  id: string;
  proyectoId: string;
  usuarioId: string;
  rol?: string | null;
  dedicacionPorcentaje?: number | string | null;
  horasSemanales?: number | string | null;
  fechaInicio: string | Date;
  fechaFin?: string | Date | null;
  notas?: string | null;
  activo?: boolean;
  deletedAt?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export const toProyectoResponse = (proyecto: ProyectoResponseInput | Proyecto) => ({
  id: proyecto.id,
  nombre: proyecto.nombre,
  descripcion: proyecto.descripcion,
  codigo: proyecto.codigo,
  cliente: proyecto.cliente,
  fechaInicio: proyecto.fechaInicio,
  fechaFinEstimada: proyecto.fechaFinEstimada,
  fechaFinReal: proyecto.fechaFinReal,
  estado: proyecto.estado,
  managerId: proyecto.managerId,
  presupuestoHoras: toNumberOrUndefined(proyecto.presupuestoHoras),
  horasConsumidas: toNumberOrUndefined(proyecto.horasConsumidas),
  prioridad: proyecto.prioridad,
  color: proyecto.color,
  activo: resolveActiveState(proyecto),
  createdAt: proyecto.createdAt,
  updatedAt: proyecto.updatedAt,
});

export const toAsignacionResponse = (asignacion: AsignacionResponseInput | Asignacion) => ({
  id: asignacion.id,
  proyectoId: asignacion.proyectoId,
  usuarioId: asignacion.usuarioId,
  rol: asignacion.rol,
  dedicacionPorcentaje: toNumberOrUndefined(asignacion.dedicacionPorcentaje),
  horasSemanales: toNumberOrUndefined(asignacion.horasSemanales),
  fechaInicio: asignacion.fechaInicio,
  fechaFin: asignacion.fechaFin,
  notas: asignacion.notas,
  activo: resolveActiveState(asignacion),
  createdAt: asignacion.createdAt,
  updatedAt: asignacion.updatedAt,
});
