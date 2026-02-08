/**
 * Hook useTareas para gestión de tareas con TanStack Query
 * Sigue el patrón de use-proyectos / use-timetracking
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { del, get, patch, post, put } from '@/lib/api';
import type { 
  ApiError, 
  Tarea, 
  CreateTareaRequest, 
  UpdateTareaRequest,
  EstadoTarea
} from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface TareaListResponse {
  data: Tarea[];
}

// ============================================================================
// Query Keys
// ============================================================================

const tareasKeys = {
  all: ['tareas'] as const,
  lists: () => [...tareasKeys.all, 'list'] as const,
  byProyecto: (proyectoId: string) => 
    [...tareasKeys.lists(), 'proyecto', proyectoId] as const,
  byUsuario: (usuarioId: string) => 
    [...tareasKeys.lists(), 'usuario', usuarioId] as const,
  details: () => [...tareasKeys.all, 'detail'] as const,
  detail: (id: string) => [...tareasKeys.details(), id] as const,
};

// ============================================================================
// API Functions
// ============================================================================

function fetchTareasByProyecto(proyectoId: string): Promise<TareaListResponse> {
  return get<TareaListResponse>(`/proyectos/${proyectoId}/tareas`);
}

function fetchTareasByUsuario(usuarioId: string): Promise<TareaListResponse> {
  return get<TareaListResponse>(`/usuarios/${usuarioId}/tareas`);
}

function fetchTarea(id: string): Promise<Tarea> {
  return get<Tarea>(`/tareas/${id}`);
}

function createTarea(data: CreateTareaRequest): Promise<Tarea> {
  const { proyectoId, ...rest } = data;
  return post<Tarea>(`/proyectos/${proyectoId}/tareas`, rest);
}

function updateTarea(id: string, data: UpdateTareaRequest): Promise<Tarea> {
  return put<Tarea>(`/tareas/${id}`, data);
}

function updateEstadoTarea(id: string, estado: EstadoTarea): Promise<Tarea> {
  return patch<Tarea>(`/tareas/${id}/estado`, { estado });
}

function reasignarTarea(id: string, usuarioAsignadoId: string): Promise<Tarea> {
  return patch<Tarea>(`/tareas/${id}/asignar`, { usuarioAsignadoId });
}

function deleteTarea(id: string): Promise<{ message: string }> {
  return del<{ message: string }>(`/tareas/${id}`);
}

// ============================================================================
// Hooks
// ============================================================================

export function useTareasByProyecto(proyectoId: string, enabled = true) {
  return useQuery({
    queryKey: tareasKeys.byProyecto(proyectoId),
    queryFn: () => fetchTareasByProyecto(proyectoId),
    enabled: enabled && !!proyectoId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useTareasByUsuario(usuarioId: string, enabled = true) {
  return useQuery({
    queryKey: tareasKeys.byUsuario(usuarioId),
    queryFn: () => fetchTareasByUsuario(usuarioId),
    enabled: enabled && !!usuarioId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useTarea(id: string, enabled = true) {
  return useQuery({
    queryKey: tareasKeys.detail(id),
    queryFn: () => fetchTarea(id),
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateTarea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTarea,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: tareasKeys.byProyecto(data.proyectoId) 
      });
      if (data.usuarioAsignadoId) {
        queryClient.invalidateQueries({ 
          queryKey: tareasKeys.byUsuario(data.usuarioAsignadoId) 
        });
      }
    },
    onError: (error: ApiError) => {
      console.error('Error al crear tarea:', error);
    },
  });
}

export function useUpdateTarea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTareaRequest }) =>
      updateTarea(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: tareasKeys.detail(data.id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: tareasKeys.byProyecto(data.proyectoId) 
      });
      if (data.usuarioAsignadoId) {
        queryClient.invalidateQueries({ 
          queryKey: tareasKeys.byUsuario(data.usuarioAsignadoId) 
        });
      }
    },
    onError: (error: ApiError) => {
      console.error('Error al actualizar tarea:', error);
    },
  });
}

export function useUpdateEstadoTarea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoTarea }) =>
      updateEstadoTarea(id, estado),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: tareasKeys.detail(data.id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: tareasKeys.byProyecto(data.proyectoId) 
      });
      if (data.usuarioAsignadoId) {
        queryClient.invalidateQueries({ 
          queryKey: tareasKeys.byUsuario(data.usuarioAsignadoId) 
        });
      }
    },
    onError: (error: ApiError) => {
      console.error('Error al cambiar estado:', error);
    },
  });
}

export function useReasignarTarea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, usuarioAsignadoId }: { id: string; usuarioAsignadoId: string }) =>
      reasignarTarea(id, usuarioAsignadoId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: tareasKeys.detail(data.id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: tareasKeys.byProyecto(data.proyectoId) 
      });
      if (data.usuarioAsignadoId) {
        queryClient.invalidateQueries({ 
          queryKey: tareasKeys.byUsuario(data.usuarioAsignadoId) 
        });
      }
    },
    onError: (error: ApiError) => {
      console.error('Error al reasignar tarea:', error);
    },
  });
}

export function useDeleteTarea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTarea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tareasKeys.lists() });
    },
    onError: (error: ApiError) => {
      console.error('Error al eliminar tarea:', error);
    },
  });
}
