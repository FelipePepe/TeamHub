/**
 * Cliente HTTP con interceptores HMAC + httpOnly cookies
 * 🔒 SECURITY: 
 * - Tokens enviados automáticamente vía cookies (httpOnly + Secure + SameSite=Strict)
 * - HMAC signature en cada request (previene replay attacks)
 * - CSRF token en headers para requests que mutan estado
 */
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@/types';
import { generateRequestSignature } from './hmac';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Obtiene el token CSRF desde las cookies del navegador
 * @returns CSRF token o null si no existe
 */
function getCsrfToken(): string | null {
  if (globalThis.window === undefined) return null;
  const csrfRegex = /csrf_token=([^;]+)/;
  const match = csrfRegex.exec(document.cookie);
  return match ? match[1] : null;
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true, // 🔒 SECURITY: Envía cookies httpOnly automáticamente
});

// Request interceptor: add HMAC signature and CSRF token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (globalThis.window === undefined) return config;

    // CSRF token para requests que mutan estado (POST/PUT/PATCH/DELETE)
    const method = config.method?.toUpperCase() || 'GET';
    if (method !== 'GET' && method !== 'HEAD') {
      const csrfToken = getCsrfToken();
      if (csrfToken && config.headers) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    // Firma HMAC (incluye hash del body)
    const path = `/api${config.url || ''}`;
    let body: string;
    if (config.data === null || config.data === undefined) {
      body = '';
    } else if (typeof config.data === 'string') {
      body = config.data;
    } else {
      body = JSON.stringify(config.data);
    }
    const signature = await generateRequestSignature(method, path, body);
    if (config.headers) {
      config.headers['X-Request-Signature'] = signature;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle errors (tokens auto-refresh via cookies)
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401: intentar refresh automático (cookies enviadas automáticamente)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Backend lee refresh token desde cookie, establece nuevos tokens en cookies
        const refreshPath = '/api/auth/refresh';
        const signature = await generateRequestSignature('POST', refreshPath, '');
        await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          headers: {
            'X-Request-Signature': signature,
          },
          withCredentials: true, // Envía cookies automáticamente
        });

        // Reintentar request original (con nuevas cookies establecidas)
        return api(originalRequest);
      } catch {
        // Refresh falló - cookies inválidas o expiradas
        // No hacer nada - el error se propaga al componente para mostrar mensaje
      }
    }

    throw error;
  }
);

// Helper functions
export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await api.get<T>(url, { params });
  return response.data;
}

export async function post<T>(url: string, data?: unknown): Promise<T> {
  const response = await api.post<T>(url, data);
  return response.data;
}

export async function postWithToken<T>(url: string, data: unknown, token: string): Promise<T> {
  const response = await api.post<T>(url, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

export async function put<T>(url: string, data?: unknown): Promise<T> {
  const response = await api.put<T>(url, data);
  return response.data;
}

export async function patch<T>(url: string, data?: unknown): Promise<T> {
  const response = await api.patch<T>(url, data);
  return response.data;
}

export async function del<T>(url: string): Promise<T> {
  const response = await api.delete<T>(url);
  return response.data;
}

export default api;
