// Hook useEmpleados para gestión de empleados con TanStack Query
// Generado mediante sistema colaborativo multi-LLM

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/types';
import type { EmpleadoFilters, CreateEmpleadoData, UpdateEmpleadoData } from '@/types';
import { STALE_TIME } from '@/lib/query-config';
import { empleadosKeys } from './empleados/keys';
import {
  createEmpleado,
  deleteEmpleado,
  fetchEmpleado,
  fetchEmpleados,
  updateEmpleado,
} from './empleados/api';

// ============================================================================
// Types (re-exportados desde @/types para conveniencia)
// ============================================================================

export type { EmpleadoFilters, CreateEmpleadoData, UpdateEmpleadoData };

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook para listar empleados con filtros opcionales y paginación
 *
 * @param filters - Filtros opcionales (búsqueda, rol, departamento, activo, paginación)
 * @returns Query result con lista de empleados y metadata de paginación
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useEmpleados({
 *   activo: true,
 *   departamentoId: 'dept-id',
 *   page: 1,
 *   limit: 20
 * });
 * ```
 */
export function useEmpleados(filters?: EmpleadoFilters) {
  return useQuery({
    queryKey: empleadosKeys.list(filters),
    queryFn: () => fetchEmpleados(filters),
    staleTime: STALE_TIME.LONG,
  });
}

/**
 * Hook para obtener un empleado por ID
 *
 * @param id - ID del empleado
 * @param enabled - Si debe ejecutarse la query (por defecto true)
 * @returns Query result con el empleado
 *
 * @example
 * ```tsx
 * const { data: empleado } = useEmpleado(empleadoId);
 * ```
 */
export function useEmpleado(id: string, enabled = true) {
  return useQuery({
    queryKey: empleadosKeys.detail(id),
    queryFn: () => fetchEmpleado(id),
    enabled: enabled && !!id,
    staleTime: STALE_TIME.LONG,
  });
}

/**
 * Hook para crear un empleado
 *
 * @returns Mutation para crear empleado
 */
export function useCreateEmpleado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEmpleado,
    onSuccess: () => {
      // Invalidar todas las listas para refrescar datos
      queryClient.invalidateQueries({ queryKey: empleadosKeys.lists() });
    },
    onError: (error: ApiError) => {
      if (process.env.NODE_ENV !== 'production') console.error('Error al crear empleado:', error);
    },
  });
}

/**
 * Hook para actualizar un empleado
 */
export function useUpdateEmpleado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmpleadoData }) =>
      updateEmpleado(id, data),
    onSuccess: (_, variables) => {
      // Invalidar la query del detalle y las listas
      queryClient.invalidateQueries({
        queryKey: empleadosKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: empleadosKeys.lists() });
      // Invalidar también queries por departamento y manager
      queryClient.invalidateQueries({ queryKey: [empleadosKeys.all[0], 'departamento'] });
      queryClient.invalidateQueries({ queryKey: [empleadosKeys.all[0], 'manager'] });
    },
    onError: (error: ApiError) => {
      if (process.env.NODE_ENV !== 'production') console.error('Error al actualizar empleado:', error);
    },
  });
}

/**
 * Hook para eliminar un empleado
 */
export function useDeleteEmpleado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEmpleado,
    onSuccess: () => {
      // Invalidar todas las listas para refrescar datos
      queryClient.invalidateQueries({ queryKey: empleadosKeys.lists() });
    },
    onError: (error: ApiError) => {
      if (process.env.NODE_ENV !== 'production') console.error('Error al eliminar empleado:', error);
    },
  });
}

/**
 * Hook para obtener empleados por departamento
 *
 * @param departamentoId - ID del departamento
 * @param enabled - Si debe ejecutarse la query (por defecto true)
 * @returns Query result con lista de empleados del departamento
 */
export function useEmpleadosByDepartamento(departamentoId: string, enabled = true) {
  return useQuery({
    queryKey: empleadosKeys.byDepartamento(departamentoId),
    queryFn: () => fetchEmpleados({ departamentoId, activo: true }).then((res) => res.data),
    enabled: enabled && !!departamentoId,
    staleTime: STALE_TIME.LONG,
  });
}

/**
 * Hook para obtener empleados por manager
 *
 * @param managerId - ID del manager
 * @param enabled - Si debe ejecutarse la query (por defecto true)
 * @returns Query result con lista de empleados del manager
 */
export function useEmpleadosByManager(managerId: string, enabled = true) {
  return useQuery({
    queryKey: empleadosKeys.byManager(managerId),
    queryFn: async () => {
      const response = await fetchEmpleados({ managerId, activo: true });
      return response.data;
    },
    enabled: enabled && !!managerId,
    staleTime: STALE_TIME.LONG,
  });
}
