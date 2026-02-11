import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  verifyMfa,
} from '../auth';

const apiMocks = vi.hoisted(() => ({
  post: vi.fn(),
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
});
