// Hook usePlantillas para gestión de plantillas de onboarding con TanStack Query
// Generado mediante sistema colaborativo multi-LLM

'use client';

export {
  useCreatePlantilla,
  useDeletePlantilla,
  useDuplicatePlantilla,
  usePlantilla,
  usePlantillas,
  useUpdatePlantilla,
} from './plantillas/hooks';

export {
  useCreateTareaPlantilla,
  useDeleteTareaPlantilla,
  useReorderTareasPlantilla,
  useTareasPlantilla,
  useUpdateTareaPlantilla,
} from './plantillas/tareas-hooks';

export type {
  CategoriaTarea,
  CreatePlantillaData,
  CreateTareaPlantillaData,
  CreateTareaPlantillaMutationParams,
  CreateTareaPlantillaWithAllFields,
  Plantilla,
  PlantillaFilters,
  PlantillaListResponse,
  RolDestino,
  TareaPlantilla,
  TareasPlantillaListResponse,
  TipoResponsable,
  UpdatePlantillaData,
  UpdateTareaPlantillaData,
} from './plantillas/types';
