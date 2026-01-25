import type {
  AuthTokens,
  ChangePasswordRequest,
  ChangePasswordResponse,
  LoginCredentials,
  LoginResponse,
  MfaSetupResponse,
  MfaVerifyRequest,
  MfaVerifyResponse,
  TokenPairResponse,
  User,
} from '@/types';
import { post, postWithToken, get } from './api';

// Token storage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// Auth API functions
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await post<LoginResponse>('/auth/login', credentials);
  if (response.accessToken && response.refreshToken) {
    setStoredTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });
  }
  return response;
}

export async function logout(): Promise<void> {
  try {
    await post('/auth/logout');
  } finally {
    clearStoredTokens();
  }
}

export async function refreshToken(): Promise<AuthTokens> {
  const refresh = getStoredTokens()?.refreshToken;
  if (!refresh) {
    throw new Error('No refresh token available');
  }

  const response = await post<TokenPairResponse>('/auth/refresh', {
    refreshToken: refresh,
  });

  setStoredTokens(response);
  return response;
}

export async function verifyMfa(payload: MfaVerifyRequest): Promise<MfaVerifyResponse> {
  const response = await post<MfaVerifyResponse>('/auth/mfa/verify', payload);
  setStoredTokens({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
  });
  return response;
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

// Token storage functions
export function getStoredTokens(): AuthTokens | null {
  if (typeof window === 'undefined') return null;

  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

  if (!accessToken || !refreshToken) return null;

  return { accessToken, refreshToken };
}

export function setStoredTokens(tokens: AuthTokens): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearStoredTokens(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function hasStoredTokens(): boolean {
  return getStoredTokens() !== null;
}
