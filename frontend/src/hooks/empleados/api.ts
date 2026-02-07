import { del, get, post, put } from '@/lib/api';
import type { User } from '@/types';
import type { EmpleadoFilters, CreateEmpleadoData, UpdateEmpleadoData } from '@/types';

interface EmpleadosListResponse {
  data: User[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

/**
 * Obtiene la lista de empleados con filtros opcionales y paginación
 */
export async function fetchEmpleados(
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
  if (filters?.managerId) {
    params.managerId = filters.managerId;
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
export async function fetchEmpleado(id: string): Promise<User> {
  return get<User>(`/usuarios/${id}`);
}

/**
 * Crea un nuevo empleado
 */
export async function createEmpleado(data: CreateEmpleadoData): Promise<User> {
  return post<User>('/usuarios', data);
}

/**
 * Actualiza un empleado existente
 */
export async function updateEmpleado(id: string, data: UpdateEmpleadoData): Promise<User> {
  return put<User>(`/usuarios/${id}`, data);
}

/**
 * Elimina un empleado (soft delete)
 */
export async function deleteEmpleado(id: string): Promise<void> {
  return del(`/usuarios/${id}`);
}
