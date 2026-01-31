import type { EmpleadoFilters } from '@/types';

export const empleadosKeys = {
  all: ['empleados'] as const,
  lists: () => [...empleadosKeys.all, 'list'] as const,
  list: (filters?: EmpleadoFilters) => [...empleadosKeys.lists(), filters] as const,
  details: () => [...empleadosKeys.all, 'detail'] as const,
  detail: (id: string) => [...empleadosKeys.details(), id] as const,
  byDepartamento: (departamentoId: string) =>
    [...empleadosKeys.all, 'departamento', departamentoId] as const,
  byManager: (managerId: string) => [...empleadosKeys.all, 'manager', managerId] as const,
};
