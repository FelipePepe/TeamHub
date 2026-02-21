import type { Plantilla, TareaPlantilla } from '../../store/index.js';
import { resolveActiveState } from './utils.js';

type PlantillaResponseInput = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  departamentoId?: string | null;
  rolDestino?: string | null;
  duracionEstimadaDias?: number | null;
  createdBy?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  activo?: boolean;
  deletedAt?: Date | string | null;
  /** Número de tareas asociadas a la plantilla (disponible en listado). */
  totalTareas?: number | null;
};

type TareaPlantillaResponseInput = {
  id: string;
  plantillaId: string;
  titulo: string;
  descripcion?: string | null;
  categoria: string;
  responsableTipo: string;
  responsableId?: string | null;
  diasDesdeInicio?: number | null;
  duracionEstimadaHoras?: string | number | null;
  orden: number;
  obligatoria?: boolean | null;
  requiereEvidencia?: boolean | null;
  instrucciones?: string | null;
  recursosUrl?: string[] | null;
  dependencias?: string[] | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export const toPlantillaResponse = (
  plantilla: PlantillaResponseInput | Plantilla
) => ({
  id: plantilla.id,
  nombre: plantilla.nombre,
  descripcion: plantilla.descripcion,
  departamentoId: plantilla.departamentoId,
  rolDestino: plantilla.rolDestino,
  duracionEstimadaDias: plantilla.duracionEstimadaDias,
  activo: resolveActiveState(plantilla),
  createdBy: plantilla.createdBy,
  createdAt: plantilla.createdAt,
  updatedAt: plantilla.updatedAt,
  totalTareas: 'totalTareas' in plantilla ? (plantilla.totalTareas ?? 0) : 0,
});

export const toTareaPlantillaResponse = (
  tarea: TareaPlantillaResponseInput | TareaPlantilla
) => ({
  id: tarea.id,
  plantillaId: tarea.plantillaId,
  titulo: tarea.titulo,
  descripcion: tarea.descripcion,
  categoria: tarea.categoria,
  responsable: tarea.responsableTipo,
  responsablePersonalizadoId: tarea.responsableId,
  duracionEstimadaDias: tarea.diasDesdeInicio,
  orden: tarea.orden,
  esOpcional: !(tarea.obligatoria ?? true),
  requiereAprobacion: tarea.requiereEvidencia ?? false,
  dependencias: tarea.dependencias,
  creadoEn: tarea.createdAt,
  actualizadoEn: tarea.updatedAt,
});
