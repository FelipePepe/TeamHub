import type { TimeEntryFilters } from './types';

export const timetrackingKeys = {
  all: ['timetracking'] as const,
  lists: () => [...timetrackingKeys.all, 'list'] as const,
  list: (filters?: TimeEntryFilters) => [...timetrackingKeys.lists(), filters] as const,
  misRegistros: () => [...timetrackingKeys.all, 'mis-registros'] as const,
  semana: (fecha: string) => [...timetrackingKeys.all, 'semana', fecha] as const,
  details: () => [...timetrackingKeys.all, 'detail'] as const,
  detail: (id: string) => [...timetrackingKeys.details(), id] as const,
  pendientes: () => [...timetrackingKeys.all, 'pendientes-aprobacion'] as const,
  resumen: (filters?: { usuarioId?: string; proyectoId?: string }) =>
    [...timetrackingKeys.all, 'resumen', filters] as const,
};
