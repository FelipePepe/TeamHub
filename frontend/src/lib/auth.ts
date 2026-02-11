/**
 * Cliente de autenticación - httpOnly cookies
 * 🔒 SECURITY: Tokens manejados automáticamente por cookies (httpOnly + Secure + SameSite=Strict)
 * No almacena tokens en localStorage - inmune a XSS
 */
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  LoginCredentials,
  LoginResponse,
  MfaSetupResponse,
  MfaVerifyRequest,
  MfaVerifyResponse,
  User,
} from '@/types';
import { post, postWithToken, get } from './api';

// Auth API functions
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  // Cookies establecidas automáticamente por el backend si credenciales válidas
  return await post<LoginResponse>('/auth/login', credentials);
}

export async function logout(): Promise<void> {
  // Backend limpia cookies automáticamente
  await post('/auth/logout');
}

export async function refreshToken(): Promise<void> {
  // Backend lee refresh token desde cookie, establece nuevos tokens en cookies
  await post<{ success: boolean }>('/auth/refresh', {});
}

export async function verifyMfa(payload: MfaVerifyRequest): Promise<MfaVerifyResponse> {
  // Backend establece cookies automáticamente tras verificación MFA
  return await post<MfaVerifyResponse>('/auth/mfa/verify', payload);
}

export async function changePassword(payload: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  return post<ChangePasswordResponse>('/auth/change-password', payload);
}

export async function setupMfa(mfaToken: string): Promise<MfaSetupResponse> {
  return postWithToken<MfaSetupResponse>('/auth/mfa/setup', {}, mfaToken);
}

export async function getMe(): Promise<User> {
  return get<User>('/auth/me');
}

/**
 * Verifica si el usuario tiene una sesión activa
 * @returns true si hay cookies de autenticación (verificación real en backend)
 */
export function hasActiveSession(): boolean {
  if (globalThis.window === undefined) return false;
  
  // Verificamos si existe cookie de CSRF (indicador de sesión activa)
  // Las cookies httpOnly no son accesibles desde JS, pero CSRF no es httpOnly
  return document.cookie.includes('csrf_token');
}

// DEPRECADO - Funciones legacy para migración gradual
export function getStoredTokens(): null {
  console.warn('[AUTH] getStoredTokens() está deprecado - tokens ahora en httpOnly cookies');
  return null;
}

export function setStoredTokens(): void {
  console.warn('[AUTH] setStoredTokens() está deprecado - tokens establecidos automáticamente');
}

export function clearStoredTokens(): void {
  // Limpiar cualquier token legacy que pueda existir
  if (globalThis.window === undefined) return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export function hasStoredTokens(): boolean {
  console.warn('[AUTH] hasStoredTokens() está deprecado - usa hasActiveSession()');
  return hasActiveSession();
}
