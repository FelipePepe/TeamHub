import type { ProyectoFilters } from './types';

export const proyectosKeys = {
  all: ['proyectos'] as const,
  lists: () => [...proyectosKeys.all, 'list'] as const,
  list: (filters?: ProyectoFilters) => [...proyectosKeys.lists(), filters] as const,
  misProyectos: () => [...proyectosKeys.all, 'mis-proyectos'] as const,
  details: () => [...proyectosKeys.all, 'detail'] as const,
  detail: (id: string) => [...proyectosKeys.details(), id] as const,
  stats: (id: string) => [...proyectosKeys.detail(id), 'stats'] as const,
  asignaciones: (proyectoId: string) => [...proyectosKeys.detail(proyectoId), 'asignaciones'] as const,
};
