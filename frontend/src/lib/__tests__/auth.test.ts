import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getStoredTokens,
  setStoredTokens,
  clearStoredTokens,
  hasStoredTokens,
  verifyMfa,
} from '../auth';
import type { AuthTokens } from '@/types';

const apiMocks = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
}));

vi.mock('../api', () => apiMocks);

describe('auth token storage', () => {
  const mockTokens: AuthTokens = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
  };

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('setStoredTokens', () => {
    it('stores tokens in localStorage', () => {
      setStoredTokens(mockTokens);

      expect(localStorage.getItem('accessToken')).toBe(mockTokens.accessToken);
      expect(localStorage.getItem('refreshToken')).toBe(mockTokens.refreshToken);
    });
  });

  describe('getStoredTokens', () => {
    it('returns tokens when they exist', () => {
      localStorage.setItem('accessToken', mockTokens.accessToken);
      localStorage.setItem('refreshToken', mockTokens.refreshToken);

      const tokens = getStoredTokens();

      expect(tokens).toEqual(mockTokens);
    });

    it('returns null when accessToken is missing', () => {
      localStorage.setItem('refreshToken', mockTokens.refreshToken);

      expect(getStoredTokens()).toBeNull();
    });

    it('returns null when refreshToken is missing', () => {
      localStorage.setItem('accessToken', mockTokens.accessToken);

      expect(getStoredTokens()).toBeNull();
    });

    it('returns null when no tokens exist', () => {
      expect(getStoredTokens()).toBeNull();
    });
  });

  describe('clearStoredTokens', () => {
    it('removes tokens from localStorage', () => {
      localStorage.setItem('accessToken', mockTokens.accessToken);
      localStorage.setItem('refreshToken', mockTokens.refreshToken);

      clearStoredTokens();

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('hasStoredTokens', () => {
    it('returns true when tokens exist', () => {
      setStoredTokens(mockTokens);

      expect(hasStoredTokens()).toBe(true);
    });

    it('returns false when tokens do not exist', () => {
      expect(hasStoredTokens()).toBe(false);
    });
  });

  describe('verifyMfa', () => {
    it('stores tokens returned from MFA verification', async () => {
      apiMocks.post.mockResolvedValue({
        accessToken: 'mfa-access-token',
        refreshToken: 'mfa-refresh-token',
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
      expect(localStorage.getItem('accessToken')).toBe('mfa-access-token');
      expect(localStorage.getItem('refreshToken')).toBe('mfa-refresh-token');
    });
  });
});
