// Enums
export type UserRole = 'ADMIN' | 'RRHH' | 'MANAGER' | 'EMPLEADO';

// Entidades
export interface User {
  id: string;
  email: string;
  nombre: string;
  apellidos?: string;
  rol: UserRole;
  activo: boolean;
  departamentoId?: string;
  managerId?: string;
  // Extended properties (may not be in all responses)
  telefono?: string;
  fechaNacimiento?: string;
  createdAt?: string;
  updatedAt?: string;
  bloqueado?: boolean;
  departamentoNombre?: string;
  managerNombre?: string;
  intentosFallidos?: number;
  mfaActivo?: boolean;
}

// Auth
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  mfaRequired?: boolean;
  mfaSetupRequired?: boolean;
  passwordChangeRequired?: boolean;
  mfaToken?: string;
}

export interface ChangePasswordRequest {
  mfaToken: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  mfaRequired?: boolean;
  mfaSetupRequired?: boolean;
  mfaToken: string;
}

export interface MfaSetupResponse {
  secret: string;
  otpauthUrl: string;
}

export interface TokenPairResponse {
  accessToken: string;
  refreshToken: string;
}

export interface MfaVerifyRequest {
  mfaToken: string;
  code: string;
}

export interface MfaVerifyResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  recoveryCodes?: string[];
}

// API
export interface ErrorDetail {
  path?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: ErrorDetail[];
}

// Empleados
export interface EmpleadoFilters {
  search?: string;
  rol?: UserRole;
  departamentoId?: string;
  managerId?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateEmpleadoData {
  email: string;
  password: string;
  nombre: string;
  apellidos?: string;
  rol?: UserRole;
  departamentoId?: string;
  managerId?: string;
  activo?: boolean;
  telefono?: string;
  fechaNacimiento?: string;
}

export interface UpdateEmpleadoData {
  email?: string;
  nombre?: string;
  apellidos?: string;
  rol?: UserRole;
  departamentoId?: string;
  managerId?: string;
  activo?: boolean;
  telefono?: string;
  fechaNacimiento?: string;
}

// Departamentos
export interface Departamento {
  id: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
  responsableId?: string;
  color?: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Extended properties
  _count?: { usuarios: number };
}

export interface DepartamentoFilters {
  search?: string;
  activo?: boolean;
}

export interface CreateDepartamentoData {
  nombre: string;
  codigo: string;
  descripcion?: string;
  responsableId?: string;
  color?: string;
}

export interface UpdateDepartamentoData {
  nombre?: string;
  codigo?: string;
  descripcion?: string;
  responsableId?: string;
  color?: string;
  activo?: boolean;
}

export interface DepartamentoListResponse {
  data: Departamento[];
}

export interface DepartamentoStatsResponse {
  totalEmpleados?: number;
  empleadosPorRol?: Record<string, number>;
  onboardingsActivos?: number;
}

// Tareas
export type EstadoTarea = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED';
export type PrioridadTarea = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Tarea {
  id: string;
  proyectoId: string;
  titulo: string;
  descripcion?: string;
  estado: EstadoTarea;
  prioridad: PrioridadTarea;
  usuarioAsignadoId?: string;
  usuarioAsignado?: {
    id: string;
    nombre: string;
    apellidos: string;
  };
  fechaInicio?: string;
  fechaFin?: string;
  horasEstimadas?: string;
  horasReales?: string;
  orden: number;
  dependeDe?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTareaRequest {
  proyectoId: string;
  titulo: string;
  descripcion?: string;
  prioridad?: PrioridadTarea;
  usuarioAsignadoId?: string;
  fechaInicio?: string;
  fechaFin?: string;
  horasEstimadas?: number;
  dependeDe?: string;
}

export interface UpdateTareaRequest {
  titulo?: string;
  descripcion?: string;
  estado?: EstadoTarea;
  prioridad?: PrioridadTarea;
  usuarioAsignadoId?: string;
  fechaInicio?: string;
  fechaFin?: string;
  horasEstimadas?: number;
  horasReales?: number;
  dependeDe?: string;
}
