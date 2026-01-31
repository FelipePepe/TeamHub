import { del, get, patch, post, put } from '@/lib/api';
import type {
  CopyTimeEntryResponse,
  CreateTimeEntryData,
  PendientesAprobacionResponse,
  TimeEntry,
  TimeEntryFilters,
  TimetrackingListResponse,
  TimetrackingResumenResponse,
  UpdateTimeEntryData,
} from './types';

export function fetchTimeEntries(filters?: TimeEntryFilters): Promise<TimetrackingListResponse> {
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

export function fetchMisRegistros(): Promise<TimetrackingListResponse> {
  return get<TimetrackingListResponse>('/timetracking/mis-registros');
}

export function fetchSemana(fecha: string): Promise<TimetrackingListResponse> {
  return get<TimetrackingListResponse>(`/timetracking/semana/${fecha}`);
}

export function fetchTimeEntry(id: string): Promise<TimeEntry> {
  return get<TimeEntry>(`/timetracking/${id}`);
}

export function createTimeEntry(data: CreateTimeEntryData): Promise<TimeEntry> {
  return post<TimeEntry>('/timetracking', data);
}

export function updateTimeEntry(id: string, data: UpdateTimeEntryData): Promise<TimeEntry> {
  return put<TimeEntry>(`/timetracking/${id}`, data);
}

export function deleteTimeEntry(id: string): Promise<{ message: string }> {
  return del<{ message: string }>(`/timetracking/${id}`);
}

export function aprobarTimeEntry(id: string, comentario?: string): Promise<TimeEntry> {
  return patch<TimeEntry>(`/timetracking/${id}/aprobar`, comentario != null ? { comentario } : {});
}

export function rechazarTimeEntry(id: string, comentario: string): Promise<TimeEntry> {
  return patch<TimeEntry>(`/timetracking/${id}/rechazar`, { comentario });
}

export function aprobarMasivo(ids: string[]): Promise<{ message: string }> {
  return post<{ message: string }>('/timetracking/aprobar-masivo', { ids });
}

export function fetchPendientesAprobacion(): Promise<PendientesAprobacionResponse> {
  return get<PendientesAprobacionResponse>('/timetracking/pendientes-aprobacion');
}

export function fetchResumen(filters?: {
  usuarioId?: string;
  proyectoId?: string;
}): Promise<TimetrackingResumenResponse> {
  const params: Record<string, string> = {};
  if (filters?.usuarioId) params.usuarioId = filters.usuarioId;
  if (filters?.proyectoId) params.proyectoId = filters.proyectoId;
  return get<TimetrackingResumenResponse>('/timetracking/resumen', params);
}

export function copiarRegistros(
  fechaOrigen: string,
  fechaDestino: string
): Promise<CopyTimeEntryResponse> {
  return post<CopyTimeEntryResponse>('/timetracking/copiar', {
    fechaOrigen,
    fechaDestino,
  });
}
