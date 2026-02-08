/**
 * Hook useTimetracking para registro y aprobación de horas (Fase 5).
 * Tipos y endpoints alineados con OpenAPI: docs/api/openapi (TimetrackingResponse, CreateTimetrackingRequest, etc.).
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/types';
import { timetrackingKeys } from './timetracking/keys';
import {
  aprobarMasivo,
  aprobarTimeEntry,
  copiarRegistros,
  createTimeEntry,
  deleteTimeEntry,
  fetchMisRegistros,
  fetchPendientesAprobacion,
  fetchResumen,
  fetchSemana,
  fetchTimeEntries,
  fetchTimeEntry,
  rechazarTimeEntry,
  updateTimeEntry,
} from './timetracking/api';
import type {
  CreateTimeEntryData,
  PendientesAprobacionResponse,
  TimeEntryFilters,
  TimetrackingResumenResponse,
  UpdateTimeEntryData,
} from './timetracking/types';

export type {
  CopyTimeEntryResponse,
  CreateTimeEntryData,
  PendienteAprobacionGrupo,
  PendientesAprobacionResponse,
  TimeEntry,
  TimeEntryFilters,
  TimetrackingEstado,
  TimetrackingListResponse,
  TimetrackingResumenResponse,
  UpdateTimeEntryData,
} from './timetracking/types';

// ============================================================================
// Hooks
// ============================================================================

export function useTimeEntries(filters?: TimeEntryFilters) {
  return useQuery({
    queryKey: timetrackingKeys.list(filters),
    queryFn: () => fetchTimeEntries(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function useMisRegistros() {
  return useQuery({
    queryKey: timetrackingKeys.misRegistros(),
    queryFn: fetchMisRegistros,
    staleTime: 2 * 60 * 1000,
  });
}

export function useTimeEntriesSemana(fecha: string, enabled = true) {
  return useQuery({
    queryKey: timetrackingKeys.semana(fecha),
    queryFn: () => fetchSemana(fecha),
    enabled: enabled && !!fecha,
    staleTime: 2 * 60 * 1000,
  });
}

export function useTimeEntry(id: string, enabled = true) {
  return useQuery({
    queryKey: timetrackingKeys.detail(id),
    queryFn: () => fetchTimeEntry(id),
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTimeEntryData) => createTimeEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.misRegistros() });
    },
    onError: (error: ApiError) => {
      if (process.env.NODE_ENV !== 'production') console.error('Error al crear registro:', error);
    },
  });
}

export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTimeEntryData }) =>
      updateTimeEntry(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.misRegistros() });
    },
    onError: (error: ApiError) => {
      if (process.env.NODE_ENV !== 'production') console.error('Error al actualizar registro:', error);
    },
  });
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTimeEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.misRegistros() });
    },
    onError: (error: ApiError) => {
      if (process.env.NODE_ENV !== 'production') console.error('Error al eliminar registro:', error);
    },
  });
}

export function useAprobarTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, comentario }: { id: string; comentario?: string }) =>
      aprobarTimeEntry(id, comentario),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.pendientes() });
    },
    onError: (error: ApiError) => {
      console.error('Error al aprobar registro:', error);
    },
  });
}

export function useRechazarTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, comentario }: { id: string; comentario: string }) =>
      rechazarTimeEntry(id, comentario),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.pendientes() });
    },
    onError: (error: ApiError) => {
      console.error('Error al rechazar registro:', error);
    },
  });
}

export function useAprobarMasivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => aprobarMasivo(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.pendientes() });
    },
    onError: (error: ApiError) => {
      if (process.env.NODE_ENV !== 'production') console.error('Error en aprobación masiva:', error);
    },
  });
}

export function usePendientesAprobacion(enabled = true) {
  return useQuery<PendientesAprobacionResponse>({
    queryKey: timetrackingKeys.pendientes(),
    queryFn: fetchPendientesAprobacion,
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useResumenTimetracking(filters?: {
  usuarioId?: string;
  proyectoId?: string;
}) {
  return useQuery<TimetrackingResumenResponse>({
    queryKey: timetrackingKeys.resumen(filters),
    queryFn: () => fetchResumen(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCopiarRegistros() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      fechaOrigen,
      fechaDestino,
    }: {
      fechaOrigen: string;
      fechaDestino: string;
    }) => copiarRegistros(fechaOrigen, fechaDestino),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.misRegistros() });
    },
    onError: (error: ApiError) => {
      if (process.env.NODE_ENV !== 'production') console.error('Error al copiar registros:', error);
    },
  });
}
