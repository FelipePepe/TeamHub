'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/types';
import { plantillasKeys } from './keys';
import {
  createTareaPlantilla,
  deleteTareaPlantilla,
  fetchTareasPlantilla,
  updateTareaPlantilla,
} from './api';
import type {
  CreateTareaPlantillaMutationParams,
  CreateTareaPlantillaWithAllFields,
  UpdateTareaPlantillaData,
} from './types';

/**
 * Hook para listar tareas de una plantilla
 */
export function useTareasPlantilla(plantillaId: string, enabled = true) {
  return useQuery({
    queryKey: plantillasKeys.tareas(plantillaId),
    queryFn: () => fetchTareasPlantilla(plantillaId),
    enabled: enabled && !!plantillaId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para crear una tarea en una plantilla
 */
export function useCreateTareaPlantilla() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      params: CreateTareaPlantillaMutationParams | CreateTareaPlantillaWithAllFields
    ) => {
      if ('data' in params) {
        return createTareaPlantilla(params.plantillaId, params.data);
      }
      const { plantillaId, ...data } = params;
      return createTareaPlantilla(plantillaId, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: plantillasKeys.tareas(variables.plantillaId),
      });
      queryClient.invalidateQueries({
        queryKey: plantillasKeys.detail(variables.plantillaId),
      });
    },
    onError: (error: ApiError) => {
      if (process.env.NODE_ENV !== 'production') console.error('Error al crear tarea de plantilla:', error);
    },
  });
}

/**
 * Hook para actualizar una tarea de plantilla
 */
export function useUpdateTareaPlantilla() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      plantillaId,
      tareaId,
      data,
    }: {
      plantillaId: string;
      tareaId: string;
      data: UpdateTareaPlantillaData;
    }) => updateTareaPlantilla(plantillaId, tareaId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: plantillasKeys.tareas(variables.plantillaId),
      });
    },
    onError: (error: ApiError) => {
      if (process.env.NODE_ENV !== 'production') console.error('Error al actualizar tarea de plantilla:', error);
    },
  });
}

/**
 * Hook para eliminar una tarea de plantilla
 */
export function useDeleteTareaPlantilla() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      plantillaId,
      tareaId,
    }: {
      plantillaId: string;
      tareaId: string;
    }) => deleteTareaPlantilla(plantillaId, tareaId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: plantillasKeys.tareas(variables.plantillaId),
      });
      queryClient.invalidateQueries({
        queryKey: plantillasKeys.detail(variables.plantillaId),
      });
    },
    onError: (error: ApiError) => {
      if (process.env.NODE_ENV !== 'production') console.error('Error al eliminar tarea de plantilla:', error);
    },
  });
}
