import type { ProcesoFilters } from './types';

export const procesosKeys = {
  all: ['procesos'] as const,
  lists: () => [...procesosKeys.all, 'list'] as const,
  list: (filters?: ProcesoFilters) => [...procesosKeys.lists(), filters] as const,
  details: () => [...procesosKeys.all, 'detail'] as const,
  detail: (id: string) => [...procesosKeys.details(), id] as const,
  tareas: (procesoId: string) => [...procesosKeys.detail(procesoId), 'tareas'] as const,
  misTareas: () => [...procesosKeys.all, 'mis-tareas'] as const,
  estadisticas: () => [...procesosKeys.all, 'estadisticas'] as const,
  empleado: (empleadoId: string) => [...procesosKeys.all, 'empleado', empleadoId] as const,
};
