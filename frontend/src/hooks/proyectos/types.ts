export type ProyectoEstado =
  | 'PLANIFICACION'
  | 'ACTIVO'
  | 'PAUSADO'
  | 'COMPLETADO'
  | 'CANCELADO';

export type ProyectoPrioridad = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export interface Proyecto {
  id: string;
  nombre: string;
  descripcion?: string;
  codigo: string;
  cliente?: string;
  fechaInicio?: string;
  fechaFinEstimada?: string;
  fechaFinReal?: string;
  estado: ProyectoEstado;
  managerId: string;
  presupuestoHoras?: number;
  horasConsumidas?: number;
  prioridad?: ProyectoPrioridad;
  color?: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Asignacion {
  id: string;
  proyectoId: string;
  usuarioId: string;
  rol?: string;
  dedicacionPorcentaje?: number;
  horasSemanales?: number;
  fechaInicio: string;
  fechaFin?: string;
  notas?: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProyectoFilters {
  estado?: ProyectoEstado;
  managerId?: string;
  cliente?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface ProyectoListResponse {
  data: Proyecto[];
}

export interface ProyectoStatsResponse {
  presupuestoHoras: number;
  horasConsumidas: number;
  asignacionesActivas: number;
  progreso: number;
}

export interface AsignacionListResponse {
  data: Asignacion[];
}

export interface CreateProyectoData {
  nombre: string;
  codigo: string;
  descripcion?: string;
  cliente?: string;
  fechaInicio?: string;
  fechaFinEstimada?: string;
  presupuestoHoras?: number;
  prioridad?: ProyectoPrioridad;
  color?: string;
}

export interface UpdateProyectoData {
  nombre?: string;
  descripcion?: string;
  cliente?: string;
  fechaInicio?: string;
  fechaFinEstimada?: string;
  fechaFinReal?: string;
  presupuestoHoras?: number;
  prioridad?: ProyectoPrioridad;
  color?: string;
  estado?: ProyectoEstado;
  activo?: boolean;
}

export interface CreateAsignacionData {
  usuarioId: string;
  rol?: string;
  dedicacionPorcentaje?: number;
  horasSemanales?: number;
  fechaInicio: string;
  fechaFin?: string;
  notas?: string;
}

export interface UpdateAsignacionData {
  rol?: string;
  dedicacionPorcentaje?: number;
  horasSemanales?: number;
  fechaInicio?: string;
  fechaFin?: string;
  notas?: string;
  activo?: boolean;
}
