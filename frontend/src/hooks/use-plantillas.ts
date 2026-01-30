// Hook usePlantillas para gestión de plantillas de onboarding con TanStack Query
// Generado mediante sistema colaborativo multi-LLM

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { del, get, post, put } from '@/lib/api';
import type { ApiError } from '@/types';

// ============================================================================
// Types
// ============================================================================

export type RolDestino = 'ADMIN' | 'RRHH' | 'MANAGER' | 'EMPLEADO';

export type CategoriaTarea = 
  | 'DOCUMENTACION' 
  | 'EQUIPAMIENTO' 
  | 'ACCESOS' 
  | 'FORMACION' 
  | 'REUNIONES' 
  | 'ADMINISTRATIVO';

export type TipoResponsable = 'RRHH' | 'MANAGER' | 'IT' | 'EMPLEADO' | 'CUSTOM';

export interface Plantilla {
  id: string;
  nombre: string;
  descripcion?: string;
  departamentoId?: string;
  departamentoNombre?: string;
  rolDestino?: RolDestino;
  duracionEstimadaDias?: number;
  activo: boolean;
  totalTareas?: number;
  creadoPor: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface TareaPlantilla {
  id: string;
  plantillaId: string;
  titulo: string;
  descripcion?: string;
  orden: number;
  categoria: CategoriaTarea;
  responsable: TipoResponsable;
  responsablePersonalizadoId?: string;
  duracionEstimadaDias?: number;
  esOpcional: boolean;
  requiereAprobacion: boolean;
  dependencias?: string[]; // Array de IDs de tareas de las que depende
  creadoEn: string;
  actualizadoEn: string;
}

export interface PlantillaFilters {
  departamentoId?: string;
  activo?: boolean;
}

export interface PlantillaListResponse {
  plantillas: Plantilla[];
  total: number;
}

export interface TareasPlantillaListResponse {
  tareas: TareaPlantilla[];
  total: number;
}

export interface CreatePlantillaData {
  nombre: string;
  descripcion?: string;
  departamentoId?: string;
  rolDestino?: RolDestino;
  duracionEstimadaDias?: number;
  activo?: boolean;
}

export interface UpdatePlantillaData {
  nombre?: string;
  descripcion?: string;
  departamentoId?: string;
  rolDestino?: RolDestino;
  duracionEstimadaDias?: number;
  activo?: boolean;
}

export interface CreateTareaPlantillaData {
  titulo: string;
  descripcion?: string;
  orden: number;
  categoria: CategoriaTarea;
  responsable: TipoResponsable;
  responsablePersonalizadoId?: string;
  duracionEstimadaDias?: number;
  esOpcional?: boolean;
  requiereAprobacion?: boolean;
  dependencias?: string[];
}

export interface CreateTareaPlantillaMutationParams {
  plantillaId: string;
  data: CreateTareaPlantillaData;
}

export interface CreateTareaPlantillaWithAllFields {
  plantillaId: string;
  titulo: string;
  descripcion?: string;
  orden: number;
  categoria: CategoriaTarea;
  responsable: TipoResponsable;
  responsablePersonalizadoId?: string;
  duracionEstimadaDias?: number;
  esOpcional?: boolean;
  requiereAprobacion?: boolean;
  dependencias?: string[];
}

export interface UpdateTareaPlantillaData {
  titulo?: string;
  descripcion?: string;
  orden?: number;
  categoria?: CategoriaTarea;
  responsable?: TipoResponsable;
  responsablePersonalizadoId?: string;
  duracionEstimadaDias?: number;
  esOpcional?: boolean;
  requiereAprobacion?: boolean;
  dependencias?: string[];
}

// ============================================================================
// Query Keys
// ============================================================================

const plantillasKeys = {
  all: ['plantillas'] as const,
  lists: () => [...plantillasKeys.all, 'list'] as const,
  list: (filters?: PlantillaFilters) =>
    [...plantillasKeys.lists(), filters] as const,
  details: () => [...plantillasKeys.all, 'detail'] as const,
  detail: (id: string) => [...plantillasKeys.details(), id] as const,
  tareas: (plantillaId: string) => 
    [...plantillasKeys.detail(plantillaId), 'tareas'] as const,
};

// ============================================================================
// API Functions - Plantillas
// ============================================================================

/**
 * Obtiene la lista de plantillas con filtros opcionales
 */
async function fetchPlantillas(
  filters?: PlantillaFilters
): Promise<PlantillaListResponse> {
  const params: Record<string, string> = {};

  if (filters?.departamentoId) {
    params.departamentoId = filters.departamentoId;
  }
  if (filters?.activo !== undefined) {
    params.activo = String(filters.activo);
  }

  return get<PlantillaListResponse>('/plantillas', params);
}

/**
 * Obtiene una plantilla por ID
 */
async function fetchPlantilla(id: string): Promise<Plantilla> {
  return get<Plantilla>(`/plantillas/${id}`);
}

/**
 * Crea una nueva plantilla
 */
async function createPlantilla(data: CreatePlantillaData): Promise<Plantilla> {
  return post<Plantilla>('/plantillas', data);
}

/**
 * Actualiza una plantilla existente
 */
async function updatePlantilla(
  id: string,
  data: UpdatePlantillaData
): Promise<Plantilla> {
  return put<Plantilla>(`/plantillas/${id}`, data);
}

/**
 * Elimina una plantilla
 */
async function deletePlantilla(id: string): Promise<void> {
  return del(`/plantillas/${id}`);
}

/**
 * Duplica una plantilla existente
 */
async function duplicatePlantilla(id: string): Promise<Plantilla> {
  return post<Plantilla>(`/plantillas/${id}/duplicar`, {});
}

// ============================================================================
// API Functions - Tareas de Plantilla
// ============================================================================

/**
 * Obtiene las tareas de una plantilla
 */
async function fetchTareasPlantilla(
  plantillaId: string
): Promise<TareasPlantillaListResponse> {
  return get<TareasPlantillaListResponse>(`/plantillas/${plantillaId}/tareas`);
}

/**
 * Crea una nueva tarea en una plantilla
 */
async function createTareaPlantilla(
  plantillaId: string,
  data: CreateTareaPlantillaData
): Promise<TareaPlantilla> {
  return post<TareaPlantilla>(`/plantillas/${plantillaId}/tareas`, data);
}

/**
 * Actualiza una tarea de plantilla
 */
async function updateTareaPlantilla(
  plantillaId: string,
  tareaId: string,
  data: UpdateTareaPlantillaData
): Promise<TareaPlantilla> {
  return put<TareaPlantilla>(
    `/plantillas/${plantillaId}/tareas/${tareaId}`,
    data
  );
}

/**
 * Elimina una tarea de plantilla
 */
async function deleteTareaPlantilla(
  plantillaId: string,
  tareaId: string
): Promise<void> {
  return del(`/plantillas/${plantillaId}/tareas/${tareaId}`);
}

// ============================================================================
// Hooks - Plantillas
// ============================================================================

/**
 * Hook para listar plantillas con filtros opcionales
 *
 * @param filters - Filtros opcionales (departamento, activo)
 * @returns Query result con lista de plantillas
 *
 * @example
 * ```tsx
 * const { data, isLoading } = usePlantillas({ activo: true });
 * ```
 */
export function usePlantillas(filters?: PlantillaFilters) {
  return useQuery({
    queryKey: plantillasKeys.list(filters),
    queryFn: () => fetchPlantillas(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener una plantilla por ID
 *
 * @param id - ID de la plantilla
 * @param enabled - Si debe ejecutarse la query (por defecto true)
 * @returns Query result con la plantilla
 *
 * @example
 * ```tsx
 * const { data: plantilla } = usePlantilla(plantillaId);
 * ```
 */
export function usePlantilla(id: string, enabled = true) {
  return useQuery({
    queryKey: plantillasKeys.detail(id),
    queryFn: () => fetchPlantilla(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para crear una plantilla
 *
 * @returns Mutation para crear plantilla
 *
 * @example
 * ```tsx
 * const createPlantilla = useCreatePlantilla();
 * await createPlantilla.mutateAsync({ nombre: 'Nueva Plantilla', activo: true });
 * ```
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
 *
 * @returns Mutation para actualizar plantilla
 *
 * @example
 * ```tsx
 * const updatePlantilla = useUpdatePlantilla();
 * await updatePlantilla.mutateAsync({ id, data: { nombre: 'Nuevo Nombre' } });
 * ```
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
 *
 * @returns Mutation para eliminar plantilla
 *
 * @example
 * ```tsx
 * const deletePlantilla = useDeletePlantilla();
 * await deletePlantilla.mutateAsync(plantillaId);
 * ```
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
 *
 * @returns Mutation para duplicar plantilla
 *
 * @example
 * ```tsx
 * const duplicatePlantilla = useDuplicatePlantilla();
 * await duplicatePlantilla.mutateAsync(plantillaId);
 * ```
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

// ============================================================================
// Hooks - Tareas de Plantilla
// ============================================================================

/**
 * Hook para listar tareas de una plantilla
 *
 * @param plantillaId - ID de la plantilla
 * @param enabled - Si debe ejecutarse la query (por defecto true)
 * @returns Query result con lista de tareas
 *
 * @example
 * ```tsx
 * const { data } = useTareasPlantilla(plantillaId);
 * ```
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
 *
 * @returns Mutation para crear tarea
 *
 * @example
 * ```tsx
 * const createTarea = useCreateTareaPlantilla();
 * await createTarea.mutateAsync({ plantillaId, data: { titulo: 'Nueva Tarea', ... } });
 * ```
 */
export function useCreateTareaPlantilla() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateTareaPlantillaMutationParams | CreateTareaPlantillaWithAllFields) => {
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
      console.error('Error al crear tarea de plantilla:', error);
    },
  });
}

/**
 * Hook para actualizar una tarea de plantilla
 *
 * @returns Mutation para actualizar tarea
 *
 * @example
 * ```tsx
 * const updateTarea = useUpdateTareaPlantilla();
 * await updateTarea.mutateAsync({ plantillaId, tareaId, data: { titulo: 'Nuevo título' } });
 * ```
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
      console.error('Error al actualizar tarea de plantilla:', error);
    },
  });
}

/**
 * Hook para eliminar una tarea de plantilla
 *
 * @returns Mutation para eliminar tarea
 *
 * @example
 * ```tsx
 * const deleteTarea = useDeleteTareaPlantilla();
 * await deleteTarea.mutateAsync({ plantillaId, tareaId });
 * ```
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
      console.error('Error al eliminar tarea de plantilla:', error);
    },
  });
}
