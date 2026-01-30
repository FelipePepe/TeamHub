// Hook useProyectos para gestión de proyectos y asignaciones con TanStack Query
// Sigue el patrón de use-plantillas / use-procesos (Fase 4)

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { del, get, patch, post, put } from '@/lib/api';
import type { ApiError } from '@/types';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Query Keys
// ============================================================================

const proyectosKeys = {
  all: ['proyectos'] as const,
  lists: () => [...proyectosKeys.all, 'list'] as const,
  list: (filters?: ProyectoFilters) =>
    [...proyectosKeys.lists(), filters] as const,
  misProyectos: () => [...proyectosKeys.all, 'mis-proyectos'] as const,
  details: () => [...proyectosKeys.all, 'detail'] as const,
  detail: (id: string) => [...proyectosKeys.details(), id] as const,
  stats: (id: string) => [...proyectosKeys.detail(id), 'stats'] as const,
  asignaciones: (proyectoId: string) =>
    [...proyectosKeys.detail(proyectoId), 'asignaciones'] as const,
};

// ============================================================================
// API Functions - Proyectos
// ============================================================================

function fetchProyectos(
  filters?: ProyectoFilters
): Promise<ProyectoListResponse> {
  const params: Record<string, string> = {};
  if (filters?.estado) params.estado = filters.estado;
  if (filters?.managerId) params.managerId = filters.managerId;
  if (filters?.cliente) params.cliente = filters.cliente;
  if (filters?.fechaInicio) params.fechaInicio = filters.fechaInicio;
  if (filters?.fechaFin) params.fechaFin = filters.fechaFin;
  return get<ProyectoListResponse>('/proyectos', params);
}

function fetchMisProyectos(): Promise<ProyectoListResponse> {
  return get<ProyectoListResponse>('/proyectos/mis-proyectos');
}

function fetchProyecto(id: string): Promise<Proyecto> {
  return get<Proyecto>(`/proyectos/${id}`);
}

function createProyecto(data: CreateProyectoData): Promise<Proyecto> {
  return post<Proyecto>('/proyectos', data);
}

function updateProyecto(
  id: string,
  data: UpdateProyectoData
): Promise<Proyecto> {
  return put<Proyecto>(`/proyectos/${id}`, data);
}

function deleteProyecto(id: string): Promise<{ message: string }> {
  return del<{ message: string }>(`/proyectos/${id}`);
}

function updateProyectoEstado(
  id: string,
  estado: ProyectoEstado
): Promise<Proyecto> {
  return patch<Proyecto>(`/proyectos/${id}/estado`, { estado });
}

function fetchProyectoStats(id: string): Promise<ProyectoStatsResponse> {
  return get<ProyectoStatsResponse>(`/proyectos/${id}/estadisticas`);
}

// ============================================================================
// API Functions - Asignaciones
// ============================================================================

function fetchAsignaciones(proyectoId: string): Promise<AsignacionListResponse> {
  return get<AsignacionListResponse>(`/proyectos/${proyectoId}/asignaciones`);
}

function createAsignacion(
  proyectoId: string,
  data: CreateAsignacionData
): Promise<Asignacion> {
  return post<Asignacion>(`/proyectos/${proyectoId}/asignaciones`, data);
}

function updateAsignacion(
  proyectoId: string,
  asigId: string,
  data: UpdateAsignacionData
): Promise<Asignacion> {
  return put<Asignacion>(
    `/proyectos/${proyectoId}/asignaciones/${asigId}`,
    data
  );
}

function deleteAsignacion(
  proyectoId: string,
  asigId: string
): Promise<{ message: string }> {
  return del<{ message: string }>(
    `/proyectos/${proyectoId}/asignaciones/${asigId}`
  );
}

function finalizarAsignacion(
  proyectoId: string,
  asigId: string
): Promise<Asignacion> {
  return patch<Asignacion>(
    `/proyectos/${proyectoId}/asignaciones/${asigId}/finalizar`,
    {}
  );
}

// ============================================================================
// Hooks - Proyectos
// ============================================================================

export function useProyectos(filters?: ProyectoFilters) {
  return useQuery({
    queryKey: proyectosKeys.list(filters),
    queryFn: () => fetchProyectos(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMisProyectos() {
  return useQuery({
    queryKey: proyectosKeys.misProyectos(),
    queryFn: fetchMisProyectos,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProyecto(id: string, enabled = true) {
  return useQuery({
    queryKey: proyectosKeys.detail(id),
    queryFn: () => fetchProyecto(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProyectoStats(id: string, enabled = true) {
  return useQuery({
    queryKey: proyectosKeys.stats(id),
    queryFn: () => fetchProyectoStats(id),
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateProyecto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProyecto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: proyectosKeys.misProyectos() });
    },
    onError: (error: ApiError) => {
      console.error('Error al crear proyecto:', error);
    },
  });
}

export function useUpdateProyecto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProyectoData }) =>
      updateProyecto(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: proyectosKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: proyectosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: proyectosKeys.misProyectos() });
    },
    onError: (error: ApiError) => {
      console.error('Error al actualizar proyecto:', error);
    },
  });
}

export function useDeleteProyecto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProyecto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: proyectosKeys.misProyectos() });
    },
    onError: (error: ApiError) => {
      console.error('Error al eliminar proyecto:', error);
    },
  });
}

export function useUpdateProyectoEstado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: ProyectoEstado }) =>
      updateProyectoEstado(id, estado),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: proyectosKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: proyectosKeys.lists() });
    },
    onError: (error: ApiError) => {
      console.error('Error al actualizar estado:', error);
    },
  });
}

// ============================================================================
// Hooks - Asignaciones
// ============================================================================

export function useAsignaciones(proyectoId: string, enabled = true) {
  return useQuery({
    queryKey: proyectosKeys.asignaciones(proyectoId),
    queryFn: () => fetchAsignaciones(proyectoId),
    enabled: enabled && !!proyectoId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateAsignacion(proyectoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAsignacionData) =>
      createAsignacion(proyectoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: proyectosKeys.asignaciones(proyectoId),
      });
      queryClient.invalidateQueries({
        queryKey: proyectosKeys.detail(proyectoId),
      });
      queryClient.invalidateQueries({
        queryKey: proyectosKeys.stats(proyectoId),
      });
    },
    onError: (error: ApiError) => {
      console.error('Error al crear asignación:', error);
    },
  });
}

export function useUpdateAsignacion(proyectoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      asigId,
      data,
    }: {
      asigId: string;
      data: UpdateAsignacionData;
    }) => updateAsignacion(proyectoId, asigId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: proyectosKeys.asignaciones(proyectoId),
      });
      queryClient.invalidateQueries({
        queryKey: proyectosKeys.detail(proyectoId),
      });
      queryClient.invalidateQueries({
        queryKey: proyectosKeys.stats(proyectoId),
      });
    },
    onError: (error: ApiError) => {
      console.error('Error al actualizar asignación:', error);
    },
  });
}

export function useDeleteAsignacion(proyectoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (asigId: string) => deleteAsignacion(proyectoId, asigId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: proyectosKeys.asignaciones(proyectoId),
      });
      queryClient.invalidateQueries({
        queryKey: proyectosKeys.detail(proyectoId),
      });
      queryClient.invalidateQueries({
        queryKey: proyectosKeys.stats(proyectoId),
      });
    },
    onError: (error: ApiError) => {
      console.error('Error al eliminar asignación:', error);
    },
  });
}

export function useFinalizarAsignacion(proyectoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (asigId: string) =>
      finalizarAsignacion(proyectoId, asigId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: proyectosKeys.asignaciones(proyectoId),
      });
      queryClient.invalidateQueries({
        queryKey: proyectosKeys.detail(proyectoId),
      });
    },
    onError: (error: ApiError) => {
      console.error('Error al finalizar asignación:', error);
    },
  });
}
