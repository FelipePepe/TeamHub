// Hook useProcesos para gestión de procesos de onboarding con TanStack Query
// Generado mediante sistema colaborativo multi-LLM

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch, post, put } from '@/lib/api';
import type { ApiError } from '@/types';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Query Keys
// ============================================================================

const procesosKeys = {
  all: ['procesos'] as const,
  lists: () => [...procesosKeys.all, 'list'] as const,
  list: (filters?: ProcesoFilters) =>
    [...procesosKeys.lists(), filters] as const,
  details: () => [...procesosKeys.all, 'detail'] as const,
  detail: (id: string) => [...procesosKeys.details(), id] as const,
  tareas: (procesoId: string) =>
    [...procesosKeys.detail(procesoId), 'tareas'] as const,
  misTareas: () => [...procesosKeys.all, 'mis-tareas'] as const,
  estadisticas: () => [...procesosKeys.all, 'estadisticas'] as const,
  empleado: (empleadoId: string) =>
    [...procesosKeys.all, 'empleado', empleadoId] as const,
};

// ============================================================================
// API Functions - Procesos
// ============================================================================

/**
 * Obtiene la lista de procesos con filtros opcionales
 */
async function fetchProcesos(
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
async function fetchProceso(id: string): Promise<Proceso> {
  return get<Proceso>(`/procesos/${id}`);
}

/**
 * Crea un nuevo proceso desde una plantilla
 */
async function createProceso(data: CreateProcesoData): Promise<Proceso> {
  return post<Proceso>('/procesos', data);
}

/**
 * Actualiza un proceso existente
 */
async function updateProceso(
  id: string,
  data: UpdateProcesoData
): Promise<Proceso> {
  return put<Proceso>(`/procesos/${id}`, data);
}

/**
 * Cancela un proceso
 */
async function cancelarProceso(
  id: string,
  data: CancelarProcesoData
): Promise<Proceso> {
  return patch<Proceso>(`/procesos/${id}/cancelar`, data);
}

/**
 * Pausa un proceso
 */
async function pausarProceso(id: string): Promise<Proceso> {
  return patch<Proceso>(`/procesos/${id}/pausar`, {});
}

/**
 * Reanuda un proceso pausado
 */
async function reanudarProceso(id: string): Promise<Proceso> {
  return patch<Proceso>(`/procesos/${id}/reanudar`, {});
}

/**
 * Obtiene las tareas de un proceso
 */
async function fetchTareasProceso(
  procesoId: string
): Promise<TareasOnboardingListResponse> {
  return get<TareasOnboardingListResponse>(`/procesos/${procesoId}/tareas`);
}

/**
 * Obtiene mis tareas pendientes
 */
async function fetchMisTareas(): Promise<TareasOnboardingListResponse> {
  return get<TareasOnboardingListResponse>('/procesos/mis-tareas');
}

/**
 * Obtiene estadísticas de procesos
 */
async function fetchEstadisticas(): Promise<ProcesoEstadisticas> {
  return get<ProcesoEstadisticas>('/procesos/estadisticas');
}

/**
 * Obtiene procesos por empleado
 */
async function fetchProcesosByEmpleado(
  empleadoId: string
): Promise<ProcesoListResponse> {
  return get<ProcesoListResponse>(`/procesos/empleado/${empleadoId}`);
}

/**
 * Actualiza una tarea de proceso
 */
async function updateTarea(
  procesoId: string,
  tareaId: string,
  data: UpdateTareaData
): Promise<TareaOnboarding> {
  return patch<TareaOnboarding>(
    `/procesos/${procesoId}/tareas/${tareaId}`,
    data
  );
}

/**
 * Completa una tarea
 */
async function completarTarea(
  procesoId: string,
  tareaId: string,
  data: CompletarTareaData
): Promise<TareaOnboarding> {
  return patch<TareaOnboarding>(
    `/procesos/${procesoId}/tareas/${tareaId}/completar`,
    data
  );
}

// ============================================================================
// Hooks - Procesos
// ============================================================================

/**
 * Hook para listar procesos con filtros opcionales
 *
 * @param filters - Filtros opcionales (estado, empleado, departamento)
 * @returns Query result con lista de procesos
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useProcesos({ estado: 'EN_CURSO' });
 * ```
 */
export function useProcesos(filters?: ProcesoFilters) {
  return useQuery({
    queryKey: procesosKeys.list(filters),
    queryFn: () => fetchProcesos(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener un proceso por ID
 *
 * @param id - ID del proceso
 * @param enabled - Si debe ejecutarse la query (por defecto true)
 * @returns Query result con el proceso y sus tareas
 *
 * @example
 * ```tsx
 * const { data: proceso } = useProceso(procesoId);
 * ```
 */
export function useProceso(id: string, enabled = true) {
  return useQuery({
    queryKey: procesosKeys.detail(id),
    queryFn: () => fetchProceso(id),
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000, // 2 minutos (más volátil que plantillas)
  });
}

/**
 * Hook para obtener procesos de un empleado específico
 *
 * @param empleadoId - ID del empleado
 * @param enabled - Si debe ejecutarse la query (por defecto true)
 * @returns Query result con lista de procesos del empleado
 *
 * @example
 * ```tsx
 * const { data } = useProcesosByEmpleado(empleadoId);
 * ```
 */
export function useProcesosByEmpleado(empleadoId: string, enabled = true) {
  return useQuery({
    queryKey: procesosKeys.empleado(empleadoId),
    queryFn: () => fetchProcesosByEmpleado(empleadoId),
    enabled: enabled && !!empleadoId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener estadísticas de procesos
 *
 * @returns Query result con estadísticas
 *
 * @example
 * ```tsx
 * const { data: stats } = useEstadisticasProcesos();
 * ```
 */
export function useEstadisticasProcesos() {
  return useQuery({
    queryKey: procesosKeys.estadisticas(),
    queryFn: fetchEstadisticas,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para obtener mis tareas pendientes
 *
 * @returns Query result con lista de tareas del usuario actual
 *
 * @example
 * ```tsx
 * const { data } = useMisTareas();
 * ```
 */
export function useMisTareas() {
  return useQuery({
    queryKey: procesosKeys.misTareas(),
    queryFn: fetchMisTareas,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para crear un proceso desde una plantilla
 *
 * @returns Mutation para crear proceso
 *
 * @example
 * ```tsx
 * const createProceso = useCreateProceso();
 * await createProceso.mutateAsync({ empleadoId, plantillaId, fechaInicio });
 * ```
 */
export function useCreateProceso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProceso,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procesosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: procesosKeys.estadisticas() });
    },
    onError: (error: ApiError) => {
      console.error('Error al crear proceso:', error);
    },
  });
}

/**
 * Hook para actualizar un proceso
 *
 * @returns Mutation para actualizar proceso
 *
 * @example
 * ```tsx
 * const updateProceso = useUpdateProceso();
 * await updateProceso.mutateAsync({ id, data: { notas: 'Nueva nota' } });
 * ```
 */
export function useUpdateProceso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProcesoData }) =>
      updateProceso(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: procesosKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: procesosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: procesosKeys.estadisticas() });
    },
    onError: (error: ApiError) => {
      console.error('Error al actualizar proceso:', error);
    },
  });
}

/**
 * Hook para cancelar un proceso
 *
 * @returns Mutation para cancelar proceso
 *
 * @example
 * ```tsx
 * const cancelar = useCancelarProceso();
 * await cancelar.mutateAsync({ id, motivo: 'Ya no es necesario' });
 * ```
 */
export function useCancelarProceso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: CancelarProcesoData }) =>
      cancelarProceso(id, data || {}),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: procesosKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: procesosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: procesosKeys.estadisticas() });
    },
    onError: (error: ApiError) => {
      console.error('Error al cancelar proceso:', error);
    },
  });
}

/**
 * Hook para pausar un proceso
 *
 * @returns Mutation para pausar proceso
 *
 * @example
 * ```tsx
 * const pausar = usePausarProceso();
 * await pausar.mutateAsync(procesoId);
 * ```
 */
export function usePausarProceso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pausarProceso,
    onSuccess: (proceso) => {
      queryClient.invalidateQueries({
        queryKey: procesosKeys.detail(proceso.id),
      });
      queryClient.invalidateQueries({ queryKey: procesosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: procesosKeys.estadisticas() });
    },
    onError: (error: ApiError) => {
      console.error('Error al pausar proceso:', error);
    },
  });
}

/**
 * Hook para reanudar un proceso pausado
 *
 * @returns Mutation para reanudar proceso
 *
 * @example
 * ```tsx
 * const reanudar = useReanudarProceso();
 * await reanudar.mutateAsync(procesoId);
 * ```
 */
export function useReanudarProceso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reanudarProceso,
    onSuccess: (proceso) => {
      queryClient.invalidateQueries({
        queryKey: procesosKeys.detail(proceso.id),
      });
      queryClient.invalidateQueries({ queryKey: procesosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: procesosKeys.estadisticas() });
    },
    onError: (error: ApiError) => {
      console.error('Error al reanudar proceso:', error);
    },
  });
}

// ============================================================================
// Hooks - Tareas de Proceso
// ============================================================================

/**
 * Hook para listar tareas de un proceso
 *
 * @param procesoId - ID del proceso
 * @param enabled - Si debe ejecutarse la query (por defecto true)
 * @returns Query result con lista de tareas
 *
 * @example
 * ```tsx
 * const { data } = useTareasProceso(procesoId);
 * ```
 */
export function useTareasProceso(procesoId: string, enabled = true) {
  return useQuery({
    queryKey: procesosKeys.tareas(procesoId),
    queryFn: () => fetchTareasProceso(procesoId),
    enabled: enabled && !!procesoId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook para actualizar una tarea de proceso
 *
 * @returns Mutation para actualizar tarea
 *
 * @example
 * ```tsx
 * const updateTarea = useUpdateTareaProceso();
 * await updateTarea.mutateAsync({ procesoId, tareaId, data: { prioridad: 'ALTA' } });
 * ```
 */
export function useUpdateTareaProceso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      procesoId,
      tareaId,
      data,
    }: {
      procesoId: string;
      tareaId: string;
      data: UpdateTareaData;
    }) => updateTarea(procesoId, tareaId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: procesosKeys.tareas(variables.procesoId),
      });
      queryClient.invalidateQueries({
        queryKey: procesosKeys.detail(variables.procesoId),
      });
      queryClient.invalidateQueries({ queryKey: procesosKeys.misTareas() });
    },
    onError: (error: ApiError) => {
      console.error('Error al actualizar tarea:', error);
    },
  });
}

/**
 * Hook para completar una tarea
 *
 * @returns Mutation para completar tarea
 *
 * @example
 * ```tsx
 * const completar = useCompletarTarea();
 * await completar.mutateAsync({ procesoId, tareaId, data: { notas: 'Completada' } });
 * ```
 */
export function useCompletarTarea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CompletarTareaMutationParams | CompletarTareaWithAllFields) => {
      if ('data' in params) {
        return completarTarea(params.procesoId, params.tareaId, params.data || {});
      }
      const withAllFields = params as CompletarTareaWithAllFields;
      return completarTarea(withAllFields.procesoId, withAllFields.tareaId, { 
        notas: withAllFields.notas, 
        evidenciaUrl: withAllFields.evidenciaUrl 
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: procesosKeys.tareas(variables.procesoId),
      });
      queryClient.invalidateQueries({
        queryKey: procesosKeys.detail(variables.procesoId),
      });
      queryClient.invalidateQueries({ queryKey: procesosKeys.misTareas() });
      queryClient.invalidateQueries({ queryKey: procesosKeys.estadisticas() });
    },
    onError: (error: ApiError) => {
      console.error('Error al completar tarea:', error);
    },
  });
}
