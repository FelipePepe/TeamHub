import { get, patch, post, put } from '@/lib/api';
import type {
  CancelarProcesoData,
  CompletarTareaData,
  CreateProcesoData,
  Proceso,
  ProcesoEstadisticas,
  ProcesoFilters,
  ProcesoListResponse,
  TareaOnboarding,
  TareasOnboardingListResponse,
  UpdateProcesoData,
  UpdateTareaData,
} from './types';

/**
 * Obtiene la lista de procesos con filtros opcionales
 */
export async function fetchProcesos(
  filters?: ProcesoFilters
): Promise<ProcesoListResponse> {
  const params: Record<string, string> = {};

  if (filters?.estado) {
    params.estado = filters.estado;
  }
  if (filters?.empleadoId) {
    params.empleadoId = filters.empleadoId;
  }
  if (filters?.departamentoId) {
    params.departamentoId = filters.departamentoId;
  }

  return get<ProcesoListResponse>('/procesos', params);
}

/**
 * Obtiene un proceso por ID con sus tareas
 */
export async function fetchProceso(id: string): Promise<Proceso> {
  return get<Proceso>(`/procesos/${id}`);
}

/**
 * Crea un nuevo proceso desde una plantilla
 */
export async function createProceso(data: CreateProcesoData): Promise<Proceso> {
  return post<Proceso>('/procesos', data);
}

/**
 * Actualiza un proceso existente
 */
export async function updateProceso(
  id: string,
  data: UpdateProcesoData
): Promise<Proceso> {
  return put<Proceso>(`/procesos/${id}`, data);
}

/**
 * Cancela un proceso
 */
export async function cancelarProceso(
  id: string,
  data: CancelarProcesoData
): Promise<Proceso> {
  return patch<Proceso>(`/procesos/${id}/cancelar`, data);
}

/**
 * Pausa un proceso
 */
export async function pausarProceso(id: string): Promise<Proceso> {
  return patch<Proceso>(`/procesos/${id}/pausar`, {});
}

/**
 * Reanuda un proceso pausado
 */
export async function reanudarProceso(id: string): Promise<Proceso> {
  return patch<Proceso>(`/procesos/${id}/reanudar`, {});
}

/**
 * Obtiene las tareas de un proceso
 */
export async function fetchTareasProceso(
  procesoId: string
): Promise<TareasOnboardingListResponse> {
  return get<TareasOnboardingListResponse>(`/procesos/${procesoId}/tareas`);
}

/**
 * Obtiene mis tareas pendientes
 */
export async function fetchMisTareas(): Promise<TareasOnboardingListResponse> {
  return get<TareasOnboardingListResponse>('/procesos/mis-tareas');
}

/**
 * Obtiene estadísticas de procesos
 */
export async function fetchEstadisticas(): Promise<ProcesoEstadisticas> {
  return get<ProcesoEstadisticas>('/procesos/estadisticas');
}

/**
 * Obtiene procesos por empleado
 */
export async function fetchProcesosByEmpleado(
  empleadoId: string
): Promise<ProcesoListResponse> {
  return get<ProcesoListResponse>(`/procesos/empleado/${empleadoId}`);
}

/**
 * Actualiza una tarea de proceso
 */
export async function updateTarea(
  procesoId: string,
  tareaId: string,
  data: UpdateTareaData
): Promise<TareaOnboarding> {
  return patch<TareaOnboarding>(`/procesos/${procesoId}/tareas/${tareaId}`, data);
}

/**
 * Completa una tarea
 */
export async function completarTarea(
  procesoId: string,
  tareaId: string,
  data: CompletarTareaData
): Promise<TareaOnboarding> {
  return patch<TareaOnboarding>(
    `/procesos/${procesoId}/tareas/${tareaId}/completar`,
    data
  );
}
