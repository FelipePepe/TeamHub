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
}

export interface UpdateEmpleadoData {
  email?: string;
  nombre?: string;
  apellidos?: string;
  rol?: UserRole;
  departamentoId?: string;
  managerId?: string;
  activo?: boolean;
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
