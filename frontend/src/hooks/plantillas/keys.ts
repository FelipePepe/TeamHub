import type { PlantillaFilters } from './types';

export const plantillasKeys = {
  all: ['plantillas'] as const,
  lists: () => [...plantillasKeys.all, 'list'] as const,
  list: (filters?: PlantillaFilters) => [...plantillasKeys.lists(), filters] as const,
  details: () => [...plantillasKeys.all, 'detail'] as const,
  detail: (id: string) => [...plantillasKeys.details(), id] as const,
  tareas: (plantillaId: string) => [...plantillasKeys.detail(plantillaId), 'tareas'] as const,
};
