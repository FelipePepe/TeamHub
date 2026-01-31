import type { Proceso, TareaOnboarding } from '../../store/index.js';
import { toNumberOrUndefined } from './utils.js';

type ProcesoResponseInput = {
  id: string;
  empleadoId: string;
  plantillaId: string;
  fechaInicio: string | Date;
  fechaFinEsperada?: string | Date | null;
  fechaFinReal?: string | Date | null;
  estado: string;
  progreso?: string | number | null;
  notas?: string | null;
  iniciadoPor?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type TareaOnboardingResponseInput = {
  id: string;
  procesoId: string;
  tareaPlantillaId?: string | null;
  titulo: string;
  descripcion?: string | null;
  categoria: string;
  responsableId: string;
  fechaLimite?: string | Date | null;
  estado: string;
  prioridad?: string | null;
  completadaAt?: string | Date | null;
  completadaPor?: string | null;
  notas?: string | null;
  evidenciaUrl?: string | null;
  comentariosRechazo?: string | null;
  orden?: number | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export const toProcesoResponse = (proceso: ProcesoResponseInput | Proceso) => ({
  id: proceso.id,
  empleadoId: proceso.empleadoId,
  plantillaId: proceso.plantillaId,
  fechaInicio: proceso.fechaInicio,
  fechaFinEsperada: proceso.fechaFinEsperada,
  fechaFinReal: proceso.fechaFinReal,
  estado: proceso.estado,
  progreso: toNumberOrUndefined(proceso.progreso),
  notas: proceso.notas,
  iniciadoPor: proceso.iniciadoPor,
  createdAt: proceso.createdAt,
  updatedAt: proceso.updatedAt,
});

export const toTareaOnboardingResponse = (
  tarea: TareaOnboardingResponseInput | TareaOnboarding
) => ({
  id: tarea.id,
  procesoId: tarea.procesoId,
  tareaPlantillaId: tarea.tareaPlantillaId,
  titulo: tarea.titulo,
  descripcion: tarea.descripcion,
  categoria: tarea.categoria,
  responsableId: tarea.responsableId,
  fechaLimite: tarea.fechaLimite,
  estado: tarea.estado,
  prioridad: tarea.prioridad,
  completadaAt: tarea.completadaAt,
  completadaPor: tarea.completadaPor,
  notas: tarea.notas,
  evidenciaUrl: tarea.evidenciaUrl,
  comentariosRechazo: tarea.comentariosRechazo,
  orden: tarea.orden,
  createdAt: tarea.createdAt,
  updatedAt: tarea.updatedAt,
});
