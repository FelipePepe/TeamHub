import type {
  Asignacion,
  Departamento,
  Plantilla,
  Proceso,
  Proyecto,
  TareaOnboarding,
  TareaPlantilla,
  Timetracking,
  User,
} from '../store/index.js';

type UserResponseInput = {
  id: string;
  email: string;
  nombre: string;
  apellidos?: string | null;
  rol: string;
  activo?: boolean;
  deletedAt?: Date | string | null;
};

const resolveUserActive = (user: UserResponseInput) => {
  if (typeof user.activo === 'boolean') return user.activo;
  return !user.deletedAt;
};

type DepartamentoResponseInput = {
  id: string;
  nombre: string;
  codigo: string;
  descripcion?: string | null;
  responsableId?: string | null;
  color?: string | null;
  activo?: boolean;
  deletedAt?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

const toNumberOrUndefined = (value: unknown) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

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
};

type ProyectoResponseInput = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  codigo: string;
  cliente?: string | null;
  fechaInicio?: string | Date | null;
  fechaFinEstimada?: string | Date | null;
  fechaFinReal?: string | Date | null;
  estado: string;
  managerId: string;
  presupuestoHoras?: number | string | null;
  horasConsumidas?: number | string | null;
  prioridad?: string | null;
  color?: string | null;
  activo?: boolean;
  deletedAt?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type AsignacionResponseInput = {
  id: string;
  proyectoId: string;
  usuarioId: string;
  rol?: string | null;
  dedicacionPorcentaje?: number | string | null;
  horasSemanales?: number | string | null;
  fechaInicio: string | Date;
  fechaFin?: string | Date | null;
  notas?: string | null;
  activo?: boolean;
  deletedAt?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type TimetrackingResponseInput = {
  id: string;
  usuarioId: string;
  proyectoId: string;
  fecha: string | Date;
  horas: number | string;
  descripcion: string;
  facturable: boolean;
  estado: string;
  aprobadoPor?: string | null;
  aprobadoAt?: string | Date | null;
  rechazadoPor?: string | null;
  rechazadoAt?: string | Date | null;
  comentarioRechazo?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
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
};

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

export const toUserResponse = (user: UserResponseInput | User) => ({
  id: user.id,
  email: user.email,
  nombre: user.nombre,
  apellidos: user.apellidos ?? undefined,
  rol: user.rol,
  activo: resolveUserActive(user as UserResponseInput),
});

export const toDepartamentoResponse = (
  departamento: DepartamentoResponseInput | Departamento
) => ({
  id: departamento.id,
  nombre: departamento.nombre,
  codigo: departamento.codigo,
  descripcion: departamento.descripcion,
  responsableId: departamento.responsableId,
  color: departamento.color,
  activo:
    typeof (departamento as DepartamentoResponseInput).activo === 'boolean'
      ? (departamento as DepartamentoResponseInput).activo
      : !(departamento as DepartamentoResponseInput).deletedAt,
  createdAt: departamento.createdAt,
  updatedAt: departamento.updatedAt,
});

export const toPlantillaResponse = (
  plantilla: PlantillaResponseInput | Plantilla
) => ({
  id: plantilla.id,
  nombre: plantilla.nombre,
  descripcion: plantilla.descripcion,
  departamentoId: plantilla.departamentoId,
  rolDestino: plantilla.rolDestino,
  duracionEstimadaDias: plantilla.duracionEstimadaDias,
  activo:
    typeof (plantilla as PlantillaResponseInput).activo === 'boolean'
      ? (plantilla as PlantillaResponseInput).activo
      : !(plantilla as PlantillaResponseInput).deletedAt,
  createdBy: plantilla.createdBy,
  createdAt: plantilla.createdAt,
  updatedAt: plantilla.updatedAt,
});

export const toTareaPlantillaResponse = (
  tarea: TareaPlantillaResponseInput | TareaPlantilla
) => ({
  id: tarea.id,
  plantillaId: tarea.plantillaId,
  titulo: tarea.titulo,
  descripcion: tarea.descripcion,
  categoria: tarea.categoria,
  responsableTipo: tarea.responsableTipo,
  responsableId: tarea.responsableId,
  diasDesdeInicio: tarea.diasDesdeInicio,
  duracionEstimadaHoras: toNumberOrUndefined(tarea.duracionEstimadaHoras),
  orden: tarea.orden,
  obligatoria: tarea.obligatoria,
  requiereEvidencia: tarea.requiereEvidencia,
  instrucciones: tarea.instrucciones,
  recursosUrl: tarea.recursosUrl,
  dependencias: tarea.dependencias,
});

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

export const toProyectoResponse = (proyecto: ProyectoResponseInput | Proyecto) => ({
  id: proyecto.id,
  nombre: proyecto.nombre,
  descripcion: proyecto.descripcion,
  codigo: proyecto.codigo,
  cliente: proyecto.cliente,
  fechaInicio: proyecto.fechaInicio,
  fechaFinEstimada: proyecto.fechaFinEstimada,
  fechaFinReal: proyecto.fechaFinReal,
  estado: proyecto.estado,
  managerId: proyecto.managerId,
  presupuestoHoras: toNumberOrUndefined(proyecto.presupuestoHoras),
  horasConsumidas: toNumberOrUndefined(proyecto.horasConsumidas),
  prioridad: proyecto.prioridad,
  color: proyecto.color,
  activo:
    typeof (proyecto as ProyectoResponseInput).activo === 'boolean'
      ? (proyecto as ProyectoResponseInput).activo
      : !(proyecto as ProyectoResponseInput).deletedAt,
  createdAt: proyecto.createdAt,
  updatedAt: proyecto.updatedAt,
});

export const toAsignacionResponse = (asignacion: AsignacionResponseInput | Asignacion) => ({
  id: asignacion.id,
  proyectoId: asignacion.proyectoId,
  usuarioId: asignacion.usuarioId,
  rol: asignacion.rol,
  dedicacionPorcentaje: toNumberOrUndefined(asignacion.dedicacionPorcentaje),
  horasSemanales: toNumberOrUndefined(asignacion.horasSemanales),
  fechaInicio: asignacion.fechaInicio,
  fechaFin: asignacion.fechaFin,
  notas: asignacion.notas,
  activo:
    typeof (asignacion as AsignacionResponseInput).activo === 'boolean'
      ? (asignacion as AsignacionResponseInput).activo
      : !(asignacion as AsignacionResponseInput).deletedAt,
  createdAt: asignacion.createdAt,
  updatedAt: asignacion.updatedAt,
});

export const toTimetrackingResponse = (
  registro: TimetrackingResponseInput | Timetracking
) => ({
  id: registro.id,
  usuarioId: registro.usuarioId,
  proyectoId: registro.proyectoId,
  fecha: registro.fecha,
  horas: toNumberOrUndefined(registro.horas),
  descripcion: registro.descripcion,
  facturable: registro.facturable,
  estado: registro.estado,
  aprobadoPor: registro.aprobadoPor,
  aprobadoAt: registro.aprobadoAt,
  rechazadoPor: registro.rechazadoPor,
  rechazadoAt: registro.rechazadoAt,
  comentarioRechazo: registro.comentarioRechazo,
  createdAt: registro.createdAt,
  updatedAt: registro.updatedAt,
});
