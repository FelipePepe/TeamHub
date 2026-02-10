'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/types';
import { STALE_TIME } from '@/lib/query-config';
import { plantillasKeys } from './keys';
import {
  createPlantilla,
  deletePlantilla,
  duplicatePlantilla,
  fetchPlantilla,
  fetchPlantillas,
  updatePlantilla,
} from './api';
import type { PlantillaFilters, UpdatePlantillaData } from './types';

/**
 * Hook para listar plantillas con filtros opcionales
 */
export function usePlantillas(filters?: PlantillaFilters) {
  return useQuery({
    queryKey: plantillasKeys.list(filters),
    queryFn: () => fetchPlantillas(filters),
    staleTime: STALE_TIME.LONG,
  });
}

/**
 * Hook para obtener una plantilla por ID
 */
export function usePlantilla(id: string, enabled = true) {
  return useQuery({
    queryKey: plantillasKeys.detail(id),
    queryFn: () => fetchPlantilla(id),
    enabled: enabled && !!id,
    staleTime: STALE_TIME.LONG,
  });
}

/**
 * Hook para crear una plantilla
 */
export function useCreatePlantilla() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlantilla,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plantillasKeys.lists() });
    },
    onError: (error: ApiError) => {
      console.error('Error al crear plantilla:', error);
    },
  });
}

/**
 * Hook para actualizar una plantilla
 */
export function useUpdatePlantilla() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlantillaData }) =>
      updatePlantilla(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: plantillasKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: plantillasKeys.lists() });
    },
    onError: (error: ApiError) => {
      console.error('Error al actualizar plantilla:', error);
    },
  });
}

/**
 * Hook para eliminar una plantilla
 */
export function useDeletePlantilla() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePlantilla,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plantillasKeys.lists() });
    },
    onError: (error: ApiError) => {
      console.error('Error al eliminar plantilla:', error);
    },
  });
}

/**
 * Hook para duplicar una plantilla
 */
export function useDuplicatePlantilla() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: duplicatePlantilla,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plantillasKeys.lists() });
    },
    onError: (error: ApiError) => {
      console.error('Error al duplicar plantilla:', error);
    },
  });
}
