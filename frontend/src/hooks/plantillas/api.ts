import { del, get, post, put } from '@/lib/api';
import type {
  CreatePlantillaData,
  CreateTareaPlantillaData,
  Plantilla,
  PlantillaFilters,
  PlantillaListResponse,
  TareaPlantilla,
  TareasPlantillaListResponse,
  UpdatePlantillaData,
  UpdateTareaPlantillaData,
} from './types';

/**
 * Obtiene la lista de plantillas con filtros opcionales
 */
export async function fetchPlantillas(
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
export async function fetchPlantilla(id: string): Promise<Plantilla> {
  return get<Plantilla>(`/plantillas/${id}`);
}

/**
 * Crea una nueva plantilla
 */
export async function createPlantilla(data: CreatePlantillaData): Promise<Plantilla> {
  return post<Plantilla>('/plantillas', data);
}

/**
 * Actualiza una plantilla existente
 */
export async function updatePlantilla(
  id: string,
  data: UpdatePlantillaData
): Promise<Plantilla> {
  return put<Plantilla>(`/plantillas/${id}`, data);
}

/**
 * Elimina una plantilla
 */
export async function deletePlantilla(id: string): Promise<void> {
  return del(`/plantillas/${id}`);
}

/**
 * Duplica una plantilla existente
 */
export async function duplicatePlantilla(id: string): Promise<Plantilla> {
  return post<Plantilla>(`/plantillas/${id}/duplicar`, {});
}

/**
 * Obtiene las tareas de una plantilla
 */
export async function fetchTareasPlantilla(
  plantillaId: string
): Promise<TareasPlantillaListResponse> {
  return get<TareasPlantillaListResponse>(`/plantillas/${plantillaId}/tareas`);
}

/**
 * Crea una nueva tarea en una plantilla
 */
export async function createTareaPlantilla(
  plantillaId: string,
  data: CreateTareaPlantillaData
): Promise<TareaPlantilla> {
  return post<TareaPlantilla>(`/plantillas/${plantillaId}/tareas`, data);
}

/**
 * Actualiza una tarea de plantilla
 */
export async function updateTareaPlantilla(
  plantillaId: string,
  tareaId: string,
  data: UpdateTareaPlantillaData
): Promise<TareaPlantilla> {
  return put<TareaPlantilla>(`/plantillas/${plantillaId}/tareas/${tareaId}`, data);
}

/**
 * Elimina una tarea de plantilla
 */
export async function deleteTareaPlantilla(
  plantillaId: string,
  tareaId: string
): Promise<void> {
  return del(`/plantillas/${plantillaId}/tareas/${tareaId}`);
}
