// Hook useDepartamentos para gestión de departamentos con TanStack Query
// Generado mediante sistema colaborativo multi-LLM

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { del, get, post, put } from '@/lib/api';
import type {
  ApiError,
  Departamento,
  DepartamentoFilters,
  CreateDepartamentoData,
  UpdateDepartamentoData,
  DepartamentoListResponse,
} from '@/types';

// ============================================================================
// Types (re-exportados desde @/types para conveniencia)
// ============================================================================

export type {
  Departamento,
  DepartamentoFilters,
  CreateDepartamentoData,
  UpdateDepartamentoData,
  DepartamentoListResponse,
};

// ============================================================================
// Query Keys
// ============================================================================

const departamentosKeys = {
  all: ['departamentos'] as const,
  lists: () => [...departamentosKeys.all, 'list'] as const,
  list: (filters?: DepartamentoFilters) =>
    [...departamentosKeys.lists(), filters] as const,
  details: () => [...departamentosKeys.all, 'detail'] as const,
  detail: (id: string) => [...departamentosKeys.details(), id] as const,
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * Obtiene la lista de departamentos con filtros opcionales
 */
async function fetchDepartamentos(
  filters?: DepartamentoFilters
): Promise<DepartamentoListResponse> {
  const params: Record<string, string> = {};

  if (filters?.search) {
    params.search = filters.search;
  }
  if (filters?.activo !== undefined) {
    params.activo = String(filters.activo);
  }

  return get<DepartamentoListResponse>('/departamentos', params);
}

/**
 * Obtiene un departamento por ID
 */
async function fetchDepartamento(id: string): Promise<Departamento> {
  return get<Departamento>(`/departamentos/${id}`);
}

/**
 * Crea un nuevo departamento
 */
async function createDepartamento(
  data: CreateDepartamentoData
): Promise<Departamento> {
  return post<Departamento>('/departamentos', data);
}

/**
 * Actualiza un departamento existente
 */
async function updateDepartamento(
  id: string,
  data: UpdateDepartamentoData
): Promise<Departamento> {
  return put<Departamento>(`/departamentos/${id}`, data);
}

/**
 * Elimina (desactiva) un departamento
 */
async function deleteDepartamento(id: string): Promise<void> {
  return del(`/departamentos/${id}`);
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook para listar departamentos con filtros opcionales
 *
 * @param filters - Filtros opcionales (búsqueda, activo)
 * @returns Query result con lista de departamentos
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useDepartamentos({ activo: true, search: 'IT' });
 * ```
 */
export function useDepartamentos(filters?: DepartamentoFilters) {
  return useQuery({
    queryKey: departamentosKeys.list(filters),
    queryFn: () => fetchDepartamentos(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener un departamento por ID
 *
 * @param id - ID del departamento
 * @param enabled - Si debe ejecutarse la query (por defecto true)
 * @returns Query result con el departamento
 *
 * @example
 * ```tsx
 * const { data: departamento } = useDepartamento(departamentoId);
 * ```
 */
export function useDepartamento(id: string, enabled = true) {
  return useQuery({
    queryKey: departamentosKeys.detail(id),
    queryFn: () => fetchDepartamento(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para crear un departamento
 *
 * @returns Mutation para crear departamento
 */
export function useCreateDepartamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDepartamento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departamentosKeys.lists() });
    },
    onError: (error: ApiError) => {
      if (process.env.NODE_ENV !== 'production') console.error('Error al crear departamento:', error);
    },
  });
}

/**
 * Hook para actualizar un departamento
 *
 * @returns Mutation para actualizar departamento
 */
export function useUpdateDepartamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDepartamentoData }) =>
      updateDepartamento(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: departamentosKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: departamentosKeys.lists() });
    },
    onError: (error: ApiError) => {
      if (process.env.NODE_ENV !== 'production') console.error('Error al actualizar departamento:', error);
    },
  });
}

/**
 * Hook para eliminar un departamento
 *
 * @returns Mutation para eliminar departamento
 */
export function useDeleteDepartamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDepartamento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departamentosKeys.lists() });
    },
    onError: (error: ApiError) => {
      if (process.env.NODE_ENV !== 'production') console.error('Error al eliminar departamento:', error);
    },
  });
}
