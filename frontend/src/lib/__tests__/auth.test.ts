import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  login,
  logout,
  refreshToken,
  verifyMfa,
  changePassword,
  setupMfa,
  getMe,
  hasActiveSession,
  getStoredTokens,
  setStoredTokens,
  clearStoredTokens,
  hasStoredTokens,
} from '../auth';

const apiMocks = vi.hoisted(() => ({
  post: vi.fn(),
  postWithToken: vi.fn(),
  get: vi.fn(),
}));

vi.mock('../api', () => apiMocks);

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyMfa', () => {
    it('calls MFA verification endpoint with credentials', async () => {
      apiMocks.post.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          nombre: 'User',
          rol: 'ADMIN',
          activo: true,
        },
      });

      await verifyMfa({ mfaToken: 'mfa-token', code: '123456' });

      expect(apiMocks.post).toHaveBeenCalledWith('/auth/mfa/verify', {
        mfaToken: 'mfa-token',
        code: '123456',
      });
    });
  });

  it('delegates login/logout/refresh/getMe on API client', async () => {
    apiMocks.post.mockResolvedValue({ success: true });
    apiMocks.get.mockResolvedValue({ id: 'u1' });

    await login({ email: 'user@test.com', password: 'secret' });
    await logout();
    await refreshToken();
    await getMe();

    expect(apiMocks.post).toHaveBeenCalledWith('/auth/login', { email: 'user@test.com', password: 'secret' });
    expect(apiMocks.post).toHaveBeenCalledWith('/auth/logout');
    expect(apiMocks.post).toHaveBeenCalledWith('/auth/refresh', {});
    expect(apiMocks.get).toHaveBeenCalledWith('/auth/me');
  });

  it('delegates changePassword and setupMfa', async () => {
    apiMocks.post.mockResolvedValue({ ok: true });

    await changePassword({ mfaToken: 'm1', newPassword: 'nueva-clave' });
    await setupMfa('mfa-token');

    expect(apiMocks.post).toHaveBeenCalledWith('/auth/change-password', {
      mfaToken: 'm1',
      newPassword: 'nueva-clave',
    });
    expect(apiMocks.postWithToken).toHaveBeenCalledWith('/auth/mfa/setup', {}, 'mfa-token');
  });

  it('checks active session from csrf cookie', () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'csrf_token=abc123',
    });
    expect(hasActiveSession()).toBe(true);

    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'other_cookie=value',
    });
    expect(hasActiveSession()).toBe(false);
  });

  it('maintains deprecated token helpers behavior', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('accessToken', 'a');
    localStorage.setItem('refreshToken', 'r');

    expect(getStoredTokens()).toBeNull();
    setStoredTokens();
    clearStoredTokens();
    expect(hasStoredTokens()).toBe(false);

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });
});
