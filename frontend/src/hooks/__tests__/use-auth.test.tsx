import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useAuth } from '../use-auth';
import { AuthProvider } from '@/providers/auth-provider';

// Mock de la librería de auth
const authLibMocks = vi.hoisted(() => ({
  login: vi.fn(),
  verifyMfa: vi.fn(),
  changePassword: vi.fn(),
  setupMfa: vi.fn(),
  logout: vi.fn(),
  getMe: vi.fn(),
  hasStoredTokens: vi.fn(),
  clearStoredTokens: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  login: authLibMocks.login,
  verifyMfa: authLibMocks.verifyMfa,
  changePassword: authLibMocks.changePassword,
  setupMfa: authLibMocks.setupMfa,
  logout: authLibMocks.logout,
  getMe: authLibMocks.getMe,
  hasStoredTokens: authLibMocks.hasStoredTokens,
  clearStoredTokens: authLibMocks.clearStoredTokens,
}));

/**
 * Tests para useAuth hook
 * Cobertura objetivo: 80%+
 */
describe('useAuth', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    nombre: 'Test User',
    rol: 'EMPLEADO',
    activo: true,
  };

  function createWrapper() {
    function AuthProviderWrapper({ children }: { children: ReactNode }) {
      return <AuthProvider>{children}</AuthProvider>;
    }
    return AuthProviderWrapper;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    // Por defecto, no hay tokens almacenados
    authLibMocks.hasStoredTokens.mockReturnValue(false);
  });

  // ============================================================================
  // Context Tests
  // ============================================================================
  describe('Context', () => {
    it('debe lanzar error si se usa fuera del AuthProvider', () => {
      // Suprimir console.error para este test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('debe proveer contexto dentro de AuthProvider', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      // Esperar a que termine la inicialización
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current).toBeDefined();
      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.verifyMfa).toBe('function');
    });
  });

  // ============================================================================
  // Initial State Tests
  // ============================================================================
  describe('Estado Inicial', () => {
    it('debe iniciar con isLoading true', () => {
      authLibMocks.hasStoredTokens.mockReturnValue(true);
      authLibMocks.getMe.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      // Al inicio está loading
      expect(result.current.isLoading).toBe(true);
    });

    it('debe iniciar sin usuario autenticado', async () => {
      authLibMocks.hasStoredTokens.mockReturnValue(false);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('debe intentar recuperar sesión si hay tokens almacenados', async () => {
      authLibMocks.hasStoredTokens.mockReturnValue(true);
      authLibMocks.getMe.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(authLibMocks.getMe).toHaveBeenCalled();
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('debe limpiar tokens si la sesión es inválida', async () => {
      authLibMocks.hasStoredTokens.mockReturnValue(true);
      authLibMocks.getMe.mockRejectedValue(new Error('Token inválido'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(authLibMocks.clearStoredTokens).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  // ============================================================================
  // Login Tests
  // ============================================================================
  describe('login', () => {
    it('debe llamar a authLib.login con credenciales', async () => {
      const loginResponse = {
        mfaToken: 'mfa-token-123',
        mfaRequired: true,
      };
      authLibMocks.login.mockResolvedValue(loginResponse);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const response = await result.current.login('test@example.com', 'password');

      expect(authLibMocks.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
      expect(response).toEqual(loginResponse);
    });

    it('debe establecer usuario si login retorna user', async () => {
      const loginResponse = {
        user: mockUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      authLibMocks.login.mockResolvedValue(loginResponse);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('debe propagar errores de login', async () => {
      const error = new Error('Credenciales inválidas');
      authLibMocks.login.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(
        result.current.login('test@example.com', 'wrong-password')
      ).rejects.toThrow('Credenciales inválidas');
    });
  });

  // ============================================================================
  // verifyMfa Tests
  // ============================================================================
  describe('verifyMfa', () => {
    it('debe verificar MFA y establecer usuario', async () => {
      const mfaResponse = {
        user: mockUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      authLibMocks.verifyMfa.mockResolvedValue(mfaResponse);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.verifyMfa('mfa-token', '123456');
      });

      expect(authLibMocks.verifyMfa).toHaveBeenCalledWith({
        mfaToken: 'mfa-token',
        code: '123456',
      });
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('debe lanzar error si respuesta MFA no tiene usuario', async () => {
      authLibMocks.verifyMfa.mockResolvedValue({});

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(
        result.current.verifyMfa('mfa-token', '123456')
      ).rejects.toThrow('Invalid MFA response');
    });

    it('debe propagar errores de MFA', async () => {
      const error = new Error('Código MFA inválido');
      authLibMocks.verifyMfa.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(
        result.current.verifyMfa('mfa-token', '000000')
      ).rejects.toThrow('Código MFA inválido');
    });
  });

  // ============================================================================
  // changePassword Tests
  // ============================================================================
  describe('changePassword', () => {
    it('debe llamar a changePassword con los parámetros correctos', async () => {
      const changePasswordResponse = { message: 'Contraseña cambiada' };
      authLibMocks.changePassword.mockResolvedValue(changePasswordResponse);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const response = await result.current.changePassword('mfa-token', 'NewPassword1!');

      expect(authLibMocks.changePassword).toHaveBeenCalledWith({
        mfaToken: 'mfa-token',
        newPassword: 'NewPassword1!',
      });
      expect(response).toEqual(changePasswordResponse);
    });
  });

  // ============================================================================
  // setupMfa Tests
  // ============================================================================
  describe('setupMfa', () => {
    it('debe llamar a setupMfa con el token', async () => {
      const setupResponse = {
        secret: 'JBSWY3DPEHPK3PXP',
        qrCode: 'data:image/png;base64,...',
      };
      authLibMocks.setupMfa.mockResolvedValue(setupResponse);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const response = await result.current.setupMfa('mfa-token');

      expect(authLibMocks.setupMfa).toHaveBeenCalledWith('mfa-token');
      expect(response).toEqual(setupResponse);
    });
  });

  // ============================================================================
  // Logout Tests
  // ============================================================================
  describe('logout', () => {
    it('debe llamar a logout y limpiar usuario', async () => {
      authLibMocks.logout.mockResolvedValue(undefined);
      // Simular usuario autenticado
      authLibMocks.hasStoredTokens.mockReturnValue(true);
      authLibMocks.getMe.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

      await act(async () => {
        await result.current.logout();
      });

      expect(authLibMocks.logout).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  // ============================================================================
  // refreshUser Tests
  // ============================================================================
  describe('refreshUser', () => {
    it('debe refrescar los datos del usuario', async () => {
      authLibMocks.hasStoredTokens.mockReturnValue(true);
      authLibMocks.getMe.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const updatedUser = { ...mockUser, nombre: 'Updated Name' };
      authLibMocks.getMe.mockResolvedValue(updatedUser);

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(result.current.user).toEqual(updatedUser);
    });

    it('debe limpiar usuario si refresh falla', async () => {
      authLibMocks.hasStoredTokens.mockReturnValue(true);
      authLibMocks.getMe.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

      authLibMocks.getMe.mockRejectedValue(new Error('Token expirado'));

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(result.current.user).toBeNull();
      expect(authLibMocks.clearStoredTokens).toHaveBeenCalled();
    });
  });
});
