// Hook useProcesos para gestión de procesos de onboarding con TanStack Query
// Generado mediante sistema colaborativo multi-LLM

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/types';
import { STALE_TIME } from '@/lib/query-config';
import { procesosKeys } from './procesos/keys';
import {
  cancelarProceso,
  completarTarea,
  createProceso,
  fetchEstadisticas,
  fetchMisTareas,
  fetchProceso,
  fetchProcesos,
  fetchProcesosByEmpleado,
  fetchTareasProceso,
  pausarProceso,
  reanudarProceso,
  updateProceso,
  updateTarea,
} from './procesos/api';
import type {
  CancelarProcesoData,
  CompletarTareaMutationParams,
  CompletarTareaWithAllFields,
  ProcesoFilters,
  UpdateProcesoData,
  UpdateTareaData,
} from './procesos/types';

export type {
  CancelarProcesoData,
  CompletarTareaData,
  CompletarTareaMutationParams,
  CompletarTareaWithAllFields,
  CreateProcesoData,
  EstadoProceso,
  EstadoTarea,
  PrioridadTarea,
  Proceso,
  ProcesoEstadisticas,
  ProcesoFilters,
  ProcesoListResponse,
  TareaOnboarding,
  TareasOnboardingListResponse,
  UpdateProcesoData,
  UpdateTareaData,
} from './procesos/types';

/**
 * Detecta el formato legacy de completar tarea con campos sueltos.
 */
function isLegacyCompletarParams(
  params: CompletarTareaMutationParams | CompletarTareaWithAllFields
): params is CompletarTareaWithAllFields {
  return 'notas' in params || 'evidenciaUrl' in params;
}

// ============================================================================
// Hooks - Procesos
// ============================================================================

/**
 * Hook para listar procesos con filtros opcionales
 *
 * @param filters - Filtros opcionales
 * @returns Query result con lista de procesos
 */
export function useProcesos(filters?: ProcesoFilters) {
  return useQuery({
    queryKey: procesosKeys.list(filters),
    queryFn: () => fetchProcesos(filters),
    staleTime: STALE_TIME.LONG,
  });
}

/**
 * Hook para obtener un proceso por ID
 */
export function useProceso(id: string, enabled = true) {
  return useQuery({
    queryKey: procesosKeys.detail(id),
    queryFn: () => fetchProceso(id),
    enabled: enabled && !!id,
    staleTime: STALE_TIME.LONG,
  });
}

/**
 * Hook para obtener procesos por empleado
 */
export function useProcesosByEmpleado(empleadoId: string, enabled = true) {
  return useQuery({
    queryKey: procesosKeys.empleado(empleadoId),
    queryFn: () => fetchProcesosByEmpleado(empleadoId),
    enabled: enabled && !!empleadoId,
    staleTime: STALE_TIME.LONG,
  });
}

/**
 * Hook para obtener estadísticas de procesos
 */
export function useEstadisticasProcesos() {
  return useQuery({
    queryKey: procesosKeys.estadisticas(),
    queryFn: fetchEstadisticas,
    staleTime: STALE_TIME.LONG,
  });
}

/**
 * Hook para obtener mis tareas pendientes
 */
export function useMisTareas() {
  return useQuery({
    queryKey: procesosKeys.misTareas(),
    queryFn: fetchMisTareas,
    staleTime: STALE_TIME.MEDIUM,
  });
}

/**
 * Hook para crear un proceso
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
      if (process.env.NODE_ENV !== 'production') console.error('Error al crear proceso:', error);
    },
  });
}

/**
 * Hook para actualizar un proceso
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
      if (process.env.NODE_ENV !== 'production') console.error('Error al actualizar proceso:', error);
    },
  });
}

/**
 * Hook para cancelar un proceso
 */
export function useCancelarProceso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: CancelarProcesoData }) =>
      cancelarProceso(id, data ?? {}),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: procesosKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: procesosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: procesosKeys.estadisticas() });
    },
    onError: (error: ApiError) => {
      if (process.env.NODE_ENV !== 'production') console.error('Error al cancelar proceso:', error);
    },
  });
}

/**
 * Hook para pausar un proceso
 */
export function usePausarProceso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pausarProceso,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: procesosKeys.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: procesosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: procesosKeys.estadisticas() });
    },
    onError: (error: ApiError) => {
      if (process.env.NODE_ENV !== 'production') console.error('Error al pausar proceso:', error);
    },
  });
}

/**
 * Hook para reanudar un proceso
 */
export function useReanudarProceso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reanudarProceso,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: procesosKeys.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: procesosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: procesosKeys.estadisticas() });
    },
    onError: (error: ApiError) => {
      if (process.env.NODE_ENV !== 'production') console.error('Error al reanudar proceso:', error);
    },
  });
}

/**
 * Hook para listar tareas de un proceso
 */
export function useTareasProceso(procesoId: string, enabled = true) {
  return useQuery({
    queryKey: procesosKeys.tareas(procesoId),
    queryFn: () => fetchTareasProceso(procesoId),
    enabled: enabled && !!procesoId,
    staleTime: STALE_TIME.LONG,
  });
}

/**
 * Hook para actualizar una tarea de proceso
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
      if (process.env.NODE_ENV !== 'production') console.error('Error al actualizar tarea:', error);
    },
  });
}

/**
 * Hook para completar una tarea
 */
export function useCompletarTarea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      params: CompletarTareaMutationParams | CompletarTareaWithAllFields
    ) => {
      if ('data' in params) {
        return completarTarea(params.procesoId, params.tareaId, params.data ?? {});
      }

      if (isLegacyCompletarParams(params)) {
        return completarTarea(params.procesoId, params.tareaId, {
          notas: params.notas,
          evidenciaUrl: params.evidenciaUrl,
        });
      }

      return completarTarea(params.procesoId, params.tareaId, {});
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
      if (process.env.NODE_ENV !== 'production') console.error('Error al completar tarea:', error);
    },
  });
}
