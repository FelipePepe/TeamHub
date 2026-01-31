export type EstadoProceso = 'EN_CURSO' | 'COMPLETADO' | 'CANCELADO' | 'PAUSADO';
export type EstadoTarea = 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA' | 'BLOQUEADA' | 'CANCELADA';
export type PrioridadTarea = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export interface Proceso {
  id: string;
  empleadoId: string;
  empleadoNombre?: string;
  plantillaId: string;
  plantillaNombre?: string;
  fechaInicio: string;
  fechaFinEsperada?: string;
  fechaFinReal?: string;
  estado: EstadoProceso;
  progreso: string;
  notas?: string;
  iniciadoPor: string;
  creadoEn: string;
  actualizadoEn: string;
  tareas?: TareaOnboarding[];
}

export interface TareaOnboarding {
  id: string;
  procesoId: string;
  tareaPlantillaId?: string;
  titulo: string;
  descripcion?: string;
  categoria: string;
  responsableId: string;
  responsableNombre?: string;
  estado: EstadoTarea;
  prioridad: PrioridadTarea;
  orden: number;
  evidenciaUrl?: string;
  notas?: string;
  completadaAt?: string;
  completadaPor?: string;
  creadoEn: string;
  actualizadoEn: string;
  duracionEstimadaDias?: number;
}

export interface ProcesoFilters {
  estado?: EstadoProceso;
  empleadoId?: string;
  departamentoId?: string;
}

export interface ProcesoListResponse {
  data: Proceso[];
}

export interface TareasOnboardingListResponse {
  data: TareaOnboarding[];
}

export interface ProcesoEstadisticas {
  total: number;
  enCurso: number;
  completados: number;
  cancelados: number;
  pausados: number;
}

export interface CreateProcesoData {
  empleadoId: string;
  plantillaId: string;
  fechaInicio: string;
}

export interface UpdateProcesoData {
  fechaInicio?: string;
  fechaFinEsperada?: string;
  notas?: string;
  estado?: EstadoProceso;
}

export interface CancelarProcesoData {
  motivo?: string;
}

export interface UpdateTareaData {
  estado?: EstadoTarea;
  prioridad?: PrioridadTarea;
  notas?: string;
}

export interface CompletarTareaData {
  evidenciaUrl?: string;
  notas?: string;
}

export interface CompletarTareaMutationParams {
  procesoId: string;
  tareaId: string;
  data?: CompletarTareaData;
}

export interface CompletarTareaWithAllFields {
  procesoId: string;
  tareaId: string;
  notas?: string;
  evidenciaUrl?: string;
}
