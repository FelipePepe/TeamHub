import { del, get, patch, post, put } from '@/lib/api';
import type {
  Asignacion,
  AsignacionListResponse,
  CreateAsignacionData,
  CreateProyectoData,
  Proyecto,
  ProyectoEstado,
  ProyectoFilters,
  ProyectoListResponse,
  ProyectoStatsResponse,
  UpdateAsignacionData,
  UpdateProyectoData,
} from './types';

export function fetchProyectos(filters?: ProyectoFilters): Promise<ProyectoListResponse> {
  const params: Record<string, string> = {};
  if (filters?.estado) params.estado = filters.estado;
  if (filters?.managerId) params.managerId = filters.managerId;
  if (filters?.cliente) params.cliente = filters.cliente;
  if (filters?.fechaInicio) params.fechaInicio = filters.fechaInicio;
  if (filters?.fechaFin) params.fechaFin = filters.fechaFin;
  return get<ProyectoListResponse>('/proyectos', params);
}

export function fetchMisProyectos(): Promise<ProyectoListResponse> {
  return get<ProyectoListResponse>('/proyectos/mis-proyectos');
}

export function fetchProyecto(id: string): Promise<Proyecto> {
  return get<Proyecto>(`/proyectos/${id}`);
}

export function createProyecto(data: CreateProyectoData): Promise<Proyecto> {
  return post<Proyecto>('/proyectos', data);
}

export function updateProyecto(id: string, data: UpdateProyectoData): Promise<Proyecto> {
  return put<Proyecto>(`/proyectos/${id}`, data);
}

export function deleteProyecto(id: string): Promise<{ message: string }> {
  return del<{ message: string }>(`/proyectos/${id}`);
}

export function updateProyectoEstado(id: string, estado: ProyectoEstado): Promise<Proyecto> {
  return patch<Proyecto>(`/proyectos/${id}/estado`, { estado });
}

export function fetchProyectoStats(id: string): Promise<ProyectoStatsResponse> {
  return get<ProyectoStatsResponse>(`/proyectos/${id}/estadisticas`);
}

export function fetchAsignaciones(proyectoId: string): Promise<AsignacionListResponse> {
  return get<AsignacionListResponse>(`/proyectos/${proyectoId}/asignaciones`);
}

export function createAsignacion(
  proyectoId: string,
  data: CreateAsignacionData
): Promise<Asignacion> {
  return post<Asignacion>(`/proyectos/${proyectoId}/asignaciones`, data);
}

export function updateAsignacion(
  proyectoId: string,
  asigId: string,
  data: UpdateAsignacionData
): Promise<Asignacion> {
  return put<Asignacion>(`/proyectos/${proyectoId}/asignaciones/${asigId}`, data);
}

export function deleteAsignacion(
  proyectoId: string,
  asigId: string
): Promise<{ message: string }> {
  return del<{ message: string }>(`/proyectos/${proyectoId}/asignaciones/${asigId}`);
}

export function finalizarAsignacion(
  proyectoId: string,
  asigId: string
): Promise<Asignacion> {
  return patch<Asignacion>(`/proyectos/${proyectoId}/asignaciones/${asigId}/finalizar`, {});
}
