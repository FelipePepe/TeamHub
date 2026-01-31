// Hook useProyectos para gestión de proyectos y asignaciones con TanStack Query
// Sigue el patrón de use-plantillas / use-procesos (Fase 4)

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/types';
import { proyectosKeys } from './proyectos/keys';
import {
  createAsignacion,
  createProyecto,
  deleteAsignacion,
  deleteProyecto,
  fetchAsignaciones,
  fetchMisProyectos,
  fetchProyecto,
  fetchProyectoStats,
  fetchProyectos,
  finalizarAsignacion,
  updateAsignacion,
  updateProyecto,
  updateProyectoEstado,
} from './proyectos/api';
import type {
  CreateAsignacionData,
  ProyectoFilters,
  UpdateAsignacionData,
  UpdateProyectoData,
} from './proyectos/types';

export type {
  Asignacion,
  AsignacionListResponse,
  CreateAsignacionData,
  CreateProyectoData,
  Proyecto,
  ProyectoEstado,
  ProyectoFilters,
  ProyectoListResponse,
  ProyectoPrioridad,
  ProyectoStatsResponse,
  UpdateAsignacionData,
  UpdateProyectoData,
} from './proyectos/types';

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
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateProyecto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProyecto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.lists() });
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
      queryClient.invalidateQueries({ queryKey: proyectosKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: proyectosKeys.lists() });
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
    },
    onError: (error: ApiError) => {
      console.error('Error al eliminar proyecto:', error);
    },
  });
}

export function useUpdateProyectoEstado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) =>
      updateProyectoEstado(id, estado as never),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: proyectosKeys.lists() });
    },
    onError: (error: ApiError) => {
      console.error('Error al actualizar estado del proyecto:', error);
    },
  });
}

export function useAsignaciones(proyectoId: string, enabled = true) {
  return useQuery({
    queryKey: proyectosKeys.asignaciones(proyectoId),
    queryFn: () => fetchAsignaciones(proyectoId),
    enabled: enabled && !!proyectoId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateAsignacion(proyectoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAsignacionData) => createAsignacion(proyectoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.asignaciones(proyectoId) });
    },
    onError: (error: ApiError) => {
      console.error('Error al crear asignación:', error);
    },
  });
}

export function useUpdateAsignacion(proyectoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ asigId, data }: { asigId: string; data: UpdateAsignacionData }) =>
      updateAsignacion(proyectoId, asigId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.asignaciones(proyectoId) });
    },
    onError: (error: ApiError) => {
      console.error('Error al actualizar asignación:', error);
    },
  });
}

export function useDeleteAsignacion(proyectoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ asigId }: { asigId: string }) => deleteAsignacion(proyectoId, asigId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.asignaciones(proyectoId) });
    },
    onError: (error: ApiError) => {
      console.error('Error al eliminar asignación:', error);
    },
  });
}

export function useFinalizarAsignacion(proyectoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ asigId }: { asigId: string }) => finalizarAsignacion(proyectoId, asigId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proyectosKeys.asignaciones(proyectoId) });
      queryClient.invalidateQueries({ queryKey: proyectosKeys.detail(proyectoId) });
    },
    onError: (error: ApiError) => {
      console.error('Error al finalizar asignación:', error);
    },
  });
}
