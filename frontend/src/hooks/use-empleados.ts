// Hook useEmpleados para gestión de empleados con TanStack Query
// Generado mediante sistema colaborativo multi-LLM

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, put, del } from '@/lib/api';
import type { ApiError, User } from '@/types';
import type {
  EmpleadoFilters,
  CreateEmpleadoData,
  UpdateEmpleadoData,
} from '@/types';

// ============================================================================
// Types (re-exportados desde @/types para conveniencia)
// ============================================================================

export type { EmpleadoFilters, CreateEmpleadoData, UpdateEmpleadoData };

/**
 * Respuesta paginada de la API al listar empleados
 */
interface EmpleadosListResponse {
  data: User[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

// ============================================================================
// Query Keys
// ============================================================================

const empleadosKeys = {
  all: ['empleados'] as const,
  lists: () => [...empleadosKeys.all, 'list'] as const,
  list: (filters?: EmpleadoFilters) =>
    [...empleadosKeys.lists(), filters] as const,
  details: () => [...empleadosKeys.all, 'detail'] as const,
  detail: (id: string) => [...empleadosKeys.details(), id] as const,
  byDepartamento: (departamentoId: string) =>
    [...empleadosKeys.all, 'departamento', departamentoId] as const,
  byManager: (managerId: string) =>
    [...empleadosKeys.all, 'manager', managerId] as const,
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * Obtiene la lista de empleados con filtros opcionales y paginación
 */
async function fetchEmpleados(
  filters?: EmpleadoFilters
): Promise<{ data: User[]; meta: EmpleadosListResponse['meta'] }> {
  const params: Record<string, string> = {};
  if (filters?.search) {
    params.search = filters.search;
  }
  if (filters?.rol) {
    params.rol = filters.rol;
  }
  if (filters?.departamentoId) {
    params.departamentoId = filters.departamentoId;
  }
  if (filters?.activo !== undefined) {
    params.activo = String(filters.activo);
  }
  if (filters?.page) {
    params.page = String(filters.page);
  }
  if (filters?.limit) {
    params.limit = String(filters.limit);
  }
  if (filters?.sortBy) {
    params.sortBy = filters.sortBy;
  }
  if (filters?.sortOrder) {
    params.sortOrder = filters.sortOrder;
  }

  return get<EmpleadosListResponse>('/usuarios', params);
}

/**
 * Obtiene un empleado por ID
 */
async function fetchEmpleado(id: string): Promise<User> {
  return get<User>(`/usuarios/${id}`);
}

/**
 * Crea un nuevo empleado
 */
async function createEmpleado(data: CreateEmpleadoData): Promise<User> {
  return post<User>('/usuarios', data);
}

/**
 * Actualiza un empleado existente
 */
async function updateEmpleado(
  id: string,
  data: UpdateEmpleadoData
): Promise<User> {
  return put<User>(`/usuarios/${id}`, data);
}

/**
 * Elimina un empleado (soft delete)
 */
async function deleteEmpleado(id: string): Promise<void> {
  return del(`/usuarios/${id}`);
}

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
    staleTime: 5 * 60 * 1000, // 5 minutos
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
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para crear un empleado
 *
 * @returns Mutation para crear empleado
 *
 * @example
 * ```tsx
 * const createEmpleado = useCreateEmpleado();
 * 
 * createEmpleado.mutate({
 *   email: 'empleado@example.com',
 *   password: 'TempPass123!',
 *   nombre: 'Juan',
 *   apellidos: 'Pérez',
 *   rol: 'EMPLEADO',
 *   departamentoId: 'dept-id'
 * });
 * ```
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
      console.error('Error al crear empleado:', error);
    },
  });
}

/**
 * Hook para actualizar un empleado
 *
 * @returns Mutation para actualizar empleado
 *
 * @example
 * ```tsx
 * const updateEmpleado = useUpdateEmpleado();
 * 
 * updateEmpleado.mutate({
 *   id: empleadoId,
 *   data: { nombre: 'Nuevo nombre' }
 * });
 * ```
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
      console.error('Error al actualizar empleado:', error);
    },
  });
}

/**
 * Hook para eliminar un empleado
 *
 * @returns Mutation para eliminar empleado
 *
 * @example
 * ```tsx
 * const deleteEmpleado = useDeleteEmpleado();
 * 
 * deleteEmpleado.mutate(empleadoId);
 * ```
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
      console.error('Error al eliminar empleado:', error);
    },
  });
}

/**
 * Hook para obtener empleados por departamento
 *
 * @param departamentoId - ID del departamento
 * @param enabled - Si debe ejecutarse la query (por defecto true)
 * @returns Query result con lista de empleados del departamento
 *
 * @example
 * ```tsx
 * const { data } = useEmpleadosByDepartamento(departamentoId);
 * ```
 */
export function useEmpleadosByDepartamento(
  departamentoId: string,
  enabled = true
) {
  return useQuery({
    queryKey: empleadosKeys.byDepartamento(departamentoId),
    queryFn: () =>
      fetchEmpleados({ departamentoId, activo: true }).then((res) => res.data),
    enabled: enabled && !!departamentoId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener empleados por manager
 *
 * @param managerId - ID del manager
 * @param enabled - Si debe ejecutarse la query (por defecto true)
 * @returns Query result con lista de empleados del manager
 *
 * @example
 * ```tsx
 * const { data } = useEmpleadosByManager(managerId);
 * ```
 *
 * @note Actualmente filtra en el cliente ya que el backend no expone managerId en la respuesta.
 * TODO: Actualizar backend para incluir managerId en toUserResponse o añadir endpoint específico.
 */
export function useEmpleadosByManager(managerId: string, enabled = true) {
  return useQuery({
    queryKey: empleadosKeys.byManager(managerId),
    queryFn: async () => {
      // Obtener todos los empleados activos y filtrar por managerId en cliente
      // Nota: Esto no es eficiente para grandes volúmenes. Idealmente el backend
      // debería soportar filtro por managerId o incluir managerId en la respuesta
      const response = await fetchEmpleados({ activo: true });
      // Filtrado en cliente (temporal hasta que backend soporte managerId en respuesta)
      // Nota: Requiere que el backend incluya managerId en toUserResponse
      return response.data.filter((user) => user.managerId === managerId);
    },
    enabled: enabled && !!managerId,
    staleTime: 5 * 60 * 1000,
  });
}
