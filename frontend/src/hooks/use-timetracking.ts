/**
 * Hook useTimetracking para registro y aprobación de horas (Fase 5).
 * Tipos y endpoints alineados con OpenAPI: docs/api/openapi (TimetrackingResponse, CreateTimetrackingRequest, etc.).
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { del, get, patch, post, put } from '@/lib/api';
import type { ApiError } from '@/types';

// ============================================================================
// Types (OpenAPI: schemas/timetracking.yaml)
// ============================================================================

export type TimetrackingEstado = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface TimeEntry {
  id: string;
  usuarioId: string;
  proyectoId: string;
  fecha: string;
  horas: number;
  descripcion: string;
  facturable: boolean;
  estado: TimetrackingEstado;
  aprobadoPor?: string;
  aprobadoAt?: string;
  rechazadoPor?: string;
  rechazadoAt?: string;
  comentarioRechazo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimetrackingListResponse {
  data: TimeEntry[];
}

export interface TimeEntryFilters {
  usuarioId?: string;
  proyectoId?: string;
  estado?: TimetrackingEstado;
  fechaInicio?: string;
  fechaFin?: string;
  facturable?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateTimeEntryData {
  proyectoId: string;
  usuarioId?: string;
  fecha: string;
  horas: number;
  descripcion: string;
  facturable?: boolean;
}

export interface UpdateTimeEntryData {
  fecha?: string;
  horas?: number;
  descripcion?: string;
  facturable?: boolean;
}

export interface TimetrackingResumenResponse {
  totalHoras: number;
  horasFacturables: number;
  horasNoFacturables: number;
  porProyecto: { proyectoId: string; nombre?: string; horas: number }[];
  porDia: { fecha: string; horas: number }[];
  porEstado: { estado: string; horas: number }[];
}

export interface PendienteAprobacionGrupo {
  usuarioId: string;
  usuarioNombre?: string;
  proyectoId: string;
  proyectoNombre?: string;
  totalHoras: number;
  registros: TimeEntry[];
}

export interface PendientesAprobacionResponse {
  data: PendienteAprobacionGrupo[];
}

export interface CopyTimeEntryResponse {
  copied: number;
  message: string;
}

// ============================================================================
// Query Keys
// ============================================================================

const timetrackingKeys = {
  all: ['timetracking'] as const,
  lists: () => [...timetrackingKeys.all, 'list'] as const,
  list: (filters?: TimeEntryFilters) =>
    [...timetrackingKeys.lists(), filters] as const,
  misRegistros: () => [...timetrackingKeys.all, 'mis-registros'] as const,
  semana: (fecha: string) => [...timetrackingKeys.all, 'semana', fecha] as const,
  details: () => [...timetrackingKeys.all, 'detail'] as const,
  detail: (id: string) => [...timetrackingKeys.details(), id] as const,
  pendientes: () => [...timetrackingKeys.all, 'pendientes-aprobacion'] as const,
  resumen: (filters?: { usuarioId?: string; proyectoId?: string }) =>
    [...timetrackingKeys.all, 'resumen', filters] as const,
};

// ============================================================================
// API Functions (paths OpenAPI)
// ============================================================================

function fetchTimeEntries(
  filters?: TimeEntryFilters
): Promise<TimetrackingListResponse> {
  const params: Record<string, string> = {};
  if (filters?.usuarioId) params.usuarioId = filters.usuarioId;
  if (filters?.proyectoId) params.proyectoId = filters.proyectoId;
  if (filters?.estado) params.estado = filters.estado;
  if (filters?.fechaInicio) params.fechaInicio = filters.fechaInicio;
  if (filters?.fechaFin) params.fechaFin = filters.fechaFin;
  if (filters?.facturable !== undefined) params.facturable = String(filters.facturable);
  if (filters?.page) params.page = String(filters.page);
  if (filters?.limit) params.limit = String(filters.limit);
  return get<TimetrackingListResponse>('/timetracking', params);
}

function fetchMisRegistros(): Promise<TimetrackingListResponse> {
  return get<TimetrackingListResponse>('/timetracking/mis-registros');
}

function fetchSemana(fecha: string): Promise<TimetrackingListResponse> {
  return get<TimetrackingListResponse>(`/timetracking/semana/${fecha}`);
}

function fetchTimeEntry(id: string): Promise<TimeEntry> {
  return get<TimeEntry>(`/timetracking/${id}`);
}

function createTimeEntry(data: CreateTimeEntryData): Promise<TimeEntry> {
  return post<TimeEntry>('/timetracking', data);
}

function updateTimeEntry(
  id: string,
  data: UpdateTimeEntryData
): Promise<TimeEntry> {
  return put<TimeEntry>(`/timetracking/${id}`, data);
}

function deleteTimeEntry(id: string): Promise<{ message: string }> {
  return del<{ message: string }>(`/timetracking/${id}`);
}

function aprobarTimeEntry(id: string, comentario?: string): Promise<TimeEntry> {
  return patch<TimeEntry>(`/timetracking/${id}/aprobar`, comentario != null ? { comentario } : {});
}

function rechazarTimeEntry(id: string, comentario: string): Promise<TimeEntry> {
  return patch<TimeEntry>(`/timetracking/${id}/rechazar`, { comentario });
}

function aprobarMasivo(ids: string[]): Promise<{ message: string }> {
  return post<{ message: string }>('/timetracking/aprobar-masivo', { ids });
}

function fetchPendientesAprobacion(): Promise<PendientesAprobacionResponse> {
  return get<PendientesAprobacionResponse>('/timetracking/pendientes-aprobacion');
}

function fetchResumen(filters?: {
  usuarioId?: string;
  proyectoId?: string;
}): Promise<TimetrackingResumenResponse> {
  const params: Record<string, string> = {};
  if (filters?.usuarioId) params.usuarioId = filters.usuarioId;
  if (filters?.proyectoId) params.proyectoId = filters.proyectoId;
  return get<TimetrackingResumenResponse>('/timetracking/resumen', params);
}

function copiarRegistros(
  fechaOrigen: string,
  fechaDestino: string
): Promise<CopyTimeEntryResponse> {
  return post<CopyTimeEntryResponse>('/timetracking/copiar', {
    fechaOrigen,
    fechaDestino,
  });
}

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
    mutationFn: createTimeEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.misRegistros() });
    },
    onError: (error: ApiError) => {
      console.error('Error al crear registro:', error);
    },
  });
}

export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTimeEntryData }) =>
      updateTimeEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.misRegistros() });
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.pendientes() });
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.all });
    },
    onError: (error: ApiError) => {
      console.error('Error al actualizar registro:', error);
    },
  });
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTimeEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.misRegistros() });
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.pendientes() });
    },
    onError: (error: ApiError) => {
      console.error('Error al eliminar registro:', error);
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
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.misRegistros() });
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.pendientes() });
    },
    onError: (error: ApiError) => {
      console.error('Error al aprobar:', error);
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
      console.error('Error al rechazar:', error);
    },
  });
}

export function useAprobarMasivo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: aprobarMasivo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.pendientes() });
    },
    onError: (error: ApiError) => {
      console.error('Error en aprobación masiva:', error);
    },
  });
}

export function usePendientesAprobacion(enabled = true) {
  return useQuery({
    queryKey: timetrackingKeys.pendientes(),
    queryFn: fetchPendientesAprobacion,
    enabled,
    staleTime: 1 * 60 * 1000,
  });
}

export function useResumenTimetracking(filters?: {
  usuarioId?: string;
  proyectoId?: string;
}) {
  return useQuery({
    queryKey: timetrackingKeys.resumen(filters),
    queryFn: () => fetchResumen(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCopiarRegistros() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fechaOrigen, fechaDestino }: { fechaOrigen: string; fechaDestino: string }) =>
      copiarRegistros(fechaOrigen, fechaDestino),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: timetrackingKeys.misRegistros() });
    },
    onError: (error: ApiError) => {
      console.error('Error al copiar registros:', error);
    },
  });
}
