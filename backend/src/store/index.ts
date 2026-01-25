import { randomUUID } from 'crypto';

export type UserRole = 'ADMIN' | 'RRHH' | 'MANAGER' | 'EMPLEADO';
export type OnboardingEstado = 'EN_CURSO' | 'COMPLETADO' | 'CANCELADO' | 'PAUSADO';
export type TareaOnboardingEstado = 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA' | 'BLOQUEADA' | 'CANCELADA';
export type Prioridad = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';
export type ProyectoEstado = 'PLANIFICACION' | 'ACTIVO' | 'PAUSADO' | 'COMPLETADO' | 'CANCELADO';
export type TimetrackingEstado = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
export type TareaCategoria = 'DOCUMENTACION' | 'EQUIPAMIENTO' | 'ACCESOS' | 'FORMACION' | 'REUNIONES' | 'ADMINISTRATIVO';
export type ResponsableTipo = 'RRHH' | 'MANAGER' | 'IT' | 'EMPLEADO' | 'CUSTOM';

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellidos?: string;
  rol: UserRole;
  activo: boolean;
  departamentoId?: string;
  managerId?: string;
  passwordHash: string;
  mfaEnabled: boolean;
  mfaSecret?: string;
  failedLoginAttempts: number;
  lockedUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Departamento {
  id: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
  responsableId?: string;
  color?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Plantilla {
  id: string;
  nombre: string;
  descripcion?: string;
  departamentoId?: string;
  rolDestino?: UserRole;
  duracionEstimadaDias?: number;
  activo: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TareaPlantilla {
  id: string;
  plantillaId: string;
  titulo: string;
  descripcion?: string;
  categoria: TareaCategoria;
  responsableTipo: ResponsableTipo;
  responsableId?: string;
  diasDesdeInicio?: number;
  duracionEstimadaHoras?: number;
  orden: number;
  obligatoria?: boolean;
  requiereEvidencia?: boolean;
  instrucciones?: string;
  recursosUrl?: string[];
  dependencias?: string[];
}

export interface Proceso {
  id: string;
  empleadoId: string;
  plantillaId: string;
  fechaInicio: string;
  fechaFinEsperada?: string;
  fechaFinReal?: string;
  estado: OnboardingEstado;
  progreso?: number;
  notas?: string;
  iniciadoPor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TareaOnboarding {
  id: string;
  procesoId: string;
  tareaPlantillaId?: string;
  titulo: string;
  descripcion?: string;
  categoria: TareaCategoria;
  responsableId: string;
  fechaLimite?: string;
  estado: TareaOnboardingEstado;
  prioridad?: Prioridad;
  completadaAt?: string;
  completadaPor?: string;
  notas?: string;
  evidenciaUrl?: string;
  comentariosRechazo?: string;
  orden?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Proyecto {
  id: string;
  nombre: string;
  descripcion?: string;
  codigo: string;
  cliente?: string;
  fechaInicio?: string;
  fechaFinEstimada?: string;
  fechaFinReal?: string;
  estado: ProyectoEstado;
  managerId: string;
  presupuestoHoras?: number;
  horasConsumidas?: number;
  prioridad?: Prioridad;
  color?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Asignacion {
  id: string;
  proyectoId: string;
  usuarioId: string;
  rol?: string;
  dedicacionPorcentaje?: number;
  horasSemanales?: number;
  fechaInicio: string;
  fechaFin?: string;
  notas?: string;
  activo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Timetracking {
  id: string;
  usuarioId: string;
  proyectoId: string;
  fecha: string;
  horas: number;
  descripcion: string;
  facturable: boolean;
  estado: TimetrackingEstado;
  aprobadoPor?: string;
  aprobadoAt?: string;
  rechazadoPor?: string;
  rechazadoAt?: string;
  comentarioRechazo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RefreshTokenRecord {
  token: string;
  userId: string;
  expiresAt: string;
  revokedAt?: string;
}

export interface ResetTokenRecord {
  token: string;
  userId: string;
  expiresAt: string;
  usedAt?: string;
}

export const store = {
  users: new Map<string, User>(),
  departamentos: new Map<string, Departamento>(),
  plantillas: new Map<string, Plantilla>(),
  tareasPlantilla: new Map<string, TareaPlantilla>(),
  procesos: new Map<string, Proceso>(),
  tareasOnboarding: new Map<string, TareaOnboarding>(),
  proyectos: new Map<string, Proyecto>(),
  asignaciones: new Map<string, Asignacion>(),
  timetracking: new Map<string, Timetracking>(),
  refreshTokens: new Map<string, RefreshTokenRecord>(),
  resetTokens: new Map<string, ResetTokenRecord>(),
};

export const createId = () => randomUUID();
export const nowIso = () => new Date().toISOString();
export const todayDate = () => new Date().toISOString().slice(0, 10);
