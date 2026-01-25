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
