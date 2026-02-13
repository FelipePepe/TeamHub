import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HTTPException } from 'hono/http-exception';

// ── Hoisted mocks ───────────────────────────────────────────────────
const mockCreateUser = vi.hoisted(() => vi.fn());
const mockFindUserByEmail = vi.hoisted(() => vi.fn());
const mockFindActiveUserById = vi.hoisted(() => vi.fn());
const mockUpdateUserById = vi.hoisted(() => vi.fn());
const mockHashPassword = vi.hoisted(() => vi.fn());
const mockVerifyAccessToken = vi.hoisted(() => vi.fn());
const mockVerifyMfaToken = vi.hoisted(() => vi.fn());
const mockConfig = vi.hoisted(() => ({
  BOOTSTRAP_TOKEN: undefined as string | undefined,
}));

vi.mock('../../../services/users-repository.js', () => ({
  createUser: mockCreateUser,
  findUserByEmail: mockFindUserByEmail,
  findActiveUserById: mockFindActiveUserById,
  updateUserById: mockUpdateUserById,
}));

vi.mock('../../../services/auth-service.js', () => ({
  hashPassword: mockHashPassword,
  verifyAccessToken: mockVerifyAccessToken,
  verifyMfaToken: mockVerifyMfaToken,
}));

vi.mock('../../../config/env.js', () => ({
  config: mockConfig,
}));

// Import after mocks
import {
  isUniqueViolation,
  bootstrapUser,
  isAccountLocked,
  registerFailedLogin,
  resetLoginFailures,
  authenticateForMfaSetup,
  validateBootstrapToken,
} from '../helpers.js';

// ── Helpers ─────────────────────────────────────────────────────────
const createMockUser = (overrides: Record<string, unknown> = {}) => ({
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  nombre: 'Test',
  apellidos: 'User',
  rol: 'EMPLEADO',
  passwordHash: 'hashed',
  departamentoId: null,
  managerId: null,
  avatarUrl: null,
  ultimoAcceso: null,
  passwordTemporal: false,
  mfaEnabled: false,
  mfaSecret: null,
  mfaRecoveryCodes: null,
  failedLoginAttempts: 0,
  lockedUntil: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
  ...overrides,
});

const createMockContext = (authHeader?: string, user?: Record<string, unknown>) => {
  const variables = new Map<string, unknown>();
  if (user) variables.set('user', user);

  return {
    req: {
      header: (name: string) => {
        if (name === 'Authorization') return authHeader;
        return undefined;
      },
    },
    set: (key: string, value: unknown) => variables.set(key, value),
    get: (key: string) => variables.get(key),
  } as any;
};

// ── Tests ───────────────────────────────────────────────────────────
describe('auth/helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig.BOOTSTRAP_TOKEN = undefined;
  });

  // ── isUniqueViolation ─────────────────────────────────────────────
  describe('isUniqueViolation', () => {
    it('returns true for an object with code "23505"', () => {
      expect(isUniqueViolation({ code: '23505' })).toBe(true);
    });

    it('returns false for null', () => {
      expect(isUniqueViolation(null)).toBe(false);
    });

    it('returns false for a non-object value', () => {
      expect(isUniqueViolation('23505')).toBe(false);
      expect(isUniqueViolation(23505)).toBe(false);
      expect(isUniqueViolation(undefined)).toBe(false);
    });

    it('returns false for an object with a different code', () => {
      expect(isUniqueViolation({ code: '23503' })).toBe(false);
    });

    it('returns false for an object without a code property', () => {
      expect(isUniqueViolation({ message: 'error' })).toBe(false);
    });
  });

  // ── bootstrapUser ─────────────────────────────────────────────────
  describe('bootstrapUser', () => {
    it('creates an admin user successfully', async () => {
      const mockUser = createMockUser({ rol: 'ADMIN', nombre: 'Admin' });
      mockHashPassword.mockResolvedValue('hashed-password');
      mockCreateUser.mockResolvedValue(mockUser);

      const result = await bootstrapUser('admin@example.com', 'password123');

      expect(result).toEqual(mockUser);
      expect(mockHashPassword).toHaveBeenCalledWith('password123');
      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'admin@example.com',
          nombre: 'Admin',
          rol: 'ADMIN',
          passwordHash: 'hashed-password',
          mfaEnabled: false,
          failedLoginAttempts: 0,
        }),
      );
    });

    it('throws HTTPException 500 when createUser returns null', async () => {
      mockHashPassword.mockResolvedValue('hashed-password');
      mockCreateUser.mockResolvedValue(null);

      await expect(bootstrapUser('admin@example.com', 'pass')).rejects.toThrow(HTTPException);
      await expect(bootstrapUser('admin@example.com', 'pass')).rejects.toMatchObject({
        status: 500,
      });
    });

    it('finds existing user on unique violation', async () => {
      const existingUser = createMockUser({ email: 'admin@example.com', rol: 'ADMIN' });
      mockHashPassword.mockResolvedValue('hashed-password');
      mockCreateUser.mockRejectedValue({ code: '23505' });
      mockFindUserByEmail.mockResolvedValue(existingUser);

      const result = await bootstrapUser('admin@example.com', 'pass');

      expect(result).toEqual(existingUser);
      expect(mockFindUserByEmail).toHaveBeenCalledWith('admin@example.com');
    });

    it('re-throws when unique violation but findUserByEmail returns null', async () => {
      mockHashPassword.mockResolvedValue('hashed-password');
      const uniqueError = { code: '23505' };
      mockCreateUser.mockRejectedValue(uniqueError);
      mockFindUserByEmail.mockResolvedValue(null);

      await expect(bootstrapUser('admin@example.com', 'pass')).rejects.toBe(uniqueError);
    });

    it('re-throws non-unique-violation errors', async () => {
      mockHashPassword.mockResolvedValue('hashed-password');
      const otherError = new Error('Connection failed');
      mockCreateUser.mockRejectedValue(otherError);

      await expect(bootstrapUser('admin@example.com', 'pass')).rejects.toBe(otherError);
      expect(mockFindUserByEmail).not.toHaveBeenCalled();
    });
  });

  // ── isAccountLocked ───────────────────────────────────────────────
  describe('isAccountLocked', () => {
    it('returns false when lockedUntil is null', () => {
      const user = createMockUser({ lockedUntil: null });
      expect(isAccountLocked(user as any)).toBe(false);
    });

    it('returns false when lockedUntil is in the past', () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      const user = createMockUser({ lockedUntil: pastDate });
      expect(isAccountLocked(user as any)).toBe(false);
    });

    it('returns true when lockedUntil is in the future', () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      const user = createMockUser({ lockedUntil: futureDate });
      expect(isAccountLocked(user as any)).toBe(true);
    });
  });

  // ── registerFailedLogin ───────────────────────────────────────────
  describe('registerFailedLogin', () => {
    it('increments failedLoginAttempts without locking when below max', async () => {
      const user = createMockUser({ failedLoginAttempts: 0 });
      mockUpdateUserById.mockResolvedValue(undefined);

      await registerFailedLogin(user as any);

      expect(mockUpdateUserById).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({
          failedLoginAttempts: 1,
          updatedAt: expect.any(Date),
        }),
      );
      // Should NOT include lockedUntil for attempt 1 (max is 3)
      const updateCall = mockUpdateUserById.mock.calls[0][1];
      expect(updateCall.lockedUntil).toBeUndefined();
    });

    it('locks the account when failedLoginAttempts reaches max (3)', async () => {
      const user = createMockUser({ failedLoginAttempts: 2 }); // next will be 3
      mockUpdateUserById.mockResolvedValue(undefined);

      await registerFailedLogin(user as any);

      expect(mockUpdateUserById).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({
          failedLoginAttempts: 3,
          lockedUntil: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
      );
      // lockedUntil should be ~30 minutes in the future
      const updateCall = mockUpdateUserById.mock.calls[0][1];
      const lockTime = new Date(updateCall.lockedUntil).getTime();
      const expectedMin = Date.now() + 29 * 60 * 1000;
      const expectedMax = Date.now() + 31 * 60 * 1000;
      expect(lockTime).toBeGreaterThan(expectedMin);
      expect(lockTime).toBeLessThan(expectedMax);
    });

    it('locks the account when failedLoginAttempts exceeds max', async () => {
      const user = createMockUser({ failedLoginAttempts: 5 });
      mockUpdateUserById.mockResolvedValue(undefined);

      await registerFailedLogin(user as any);

      const updateCall = mockUpdateUserById.mock.calls[0][1];
      expect(updateCall.failedLoginAttempts).toBe(6);
      expect(updateCall.lockedUntil).toBeInstanceOf(Date);
    });
  });

  // ── resetLoginFailures ────────────────────────────────────────────
  describe('resetLoginFailures', () => {
    it('returns early when failedLoginAttempts is 0 and no lockedUntil', async () => {
      const user = createMockUser({ failedLoginAttempts: 0, lockedUntil: null });

      await resetLoginFailures(user as any);

      expect(mockUpdateUserById).not.toHaveBeenCalled();
    });

    it('resets when failedLoginAttempts > 0', async () => {
      const user = createMockUser({ failedLoginAttempts: 2, lockedUntil: null });
      mockUpdateUserById.mockResolvedValue(undefined);

      await resetLoginFailures(user as any);

      expect(mockUpdateUserById).toHaveBeenCalledWith(user.id, {
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: expect.any(Date),
      });
    });

    it('resets when lockedUntil is set', async () => {
      const user = createMockUser({
        failedLoginAttempts: 0,
        lockedUntil: new Date(),
      });
      mockUpdateUserById.mockResolvedValue(undefined);

      await resetLoginFailures(user as any);

      expect(mockUpdateUserById).toHaveBeenCalledWith(user.id, {
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: expect.any(Date),
      });
    });
  });

  // ── authenticateForMfaSetup ───────────────────────────────────────
  describe('authenticateForMfaSetup', () => {
    it('throws 401 when no Authorization header', async () => {
      const c = createMockContext(undefined);

      await expect(authenticateForMfaSetup(c)).rejects.toThrow(HTTPException);
      await expect(authenticateForMfaSetup(c)).rejects.toMatchObject({
        status: 401,
      });
    });

    it('throws 401 when Authorization header does not start with Bearer', async () => {
      const c = createMockContext('Basic some-token');

      await expect(authenticateForMfaSetup(c)).rejects.toThrow(HTTPException);
      await expect(authenticateForMfaSetup(c)).rejects.toMatchObject({
        status: 401,
      });
    });

    it('returns user when access token is valid', async () => {
      const mockUser = createMockUser();
      const c = createMockContext('Bearer valid-access-token');

      mockVerifyAccessToken.mockReturnValue({ sub: mockUser.id });
      mockFindActiveUserById.mockResolvedValue(mockUser);

      const result = await authenticateForMfaSetup(c);

      expect(result).toEqual(mockUser);
      expect(mockVerifyAccessToken).toHaveBeenCalledWith('valid-access-token');
      expect(mockFindActiveUserById).toHaveBeenCalledWith(mockUser.id);
    });

    it('throws 401 when access token is valid but user not found', async () => {
      const c = createMockContext('Bearer valid-access-token');
      mockVerifyAccessToken.mockReturnValue({ sub: 'nonexistent-user' });
      mockFindActiveUserById.mockResolvedValue(null);

      await expect(authenticateForMfaSetup(c)).rejects.toThrow(HTTPException);
      await expect(authenticateForMfaSetup(c)).rejects.toMatchObject({
        status: 401,
      });
    });

    it('falls back to MFA token when access token is invalid, and returns user for type=mfa', async () => {
      const mockUser = createMockUser();
      const c = createMockContext('Bearer mfa-token');

      mockVerifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid access token');
      });
      mockVerifyMfaToken.mockReturnValue({ sub: mockUser.id, type: 'mfa' });
      mockFindActiveUserById.mockResolvedValue(mockUser);

      const result = await authenticateForMfaSetup(c);

      expect(result).toEqual(mockUser);
      expect(mockVerifyAccessToken).toHaveBeenCalledWith('mfa-token');
      expect(mockVerifyMfaToken).toHaveBeenCalledWith('mfa-token');
      expect(mockFindActiveUserById).toHaveBeenCalledWith(mockUser.id);
    });

    it('throws 401 when MFA token has wrong type', async () => {
      const c = createMockContext('Bearer some-token');

      mockVerifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid access token');
      });
      mockVerifyMfaToken.mockReturnValue({ sub: 'user-1', type: 'refresh' });

      await expect(authenticateForMfaSetup(c)).rejects.toThrow(HTTPException);
      await expect(authenticateForMfaSetup(c)).rejects.toMatchObject({
        status: 401,
      });
    });

    it('throws 401 when MFA token is valid with type=mfa but user not found', async () => {
      const c = createMockContext('Bearer mfa-token');

      mockVerifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid access token');
      });
      mockVerifyMfaToken.mockReturnValue({ sub: 'nonexistent', type: 'mfa' });
      mockFindActiveUserById.mockResolvedValue(null);

      await expect(authenticateForMfaSetup(c)).rejects.toThrow(HTTPException);
      await expect(authenticateForMfaSetup(c)).rejects.toMatchObject({
        status: 401,
      });
    });

    it('throws 401 when both access token and MFA token are invalid', async () => {
      const c = createMockContext('Bearer bad-token');

      mockVerifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid access token');
      });
      mockVerifyMfaToken.mockImplementation(() => {
        throw new Error('Invalid MFA token');
      });

      await expect(authenticateForMfaSetup(c)).rejects.toThrow(HTTPException);
      await expect(authenticateForMfaSetup(c)).rejects.toMatchObject({
        status: 401,
      });
    });
  });

  // ── validateBootstrapToken ────────────────────────────────────────
  describe('validateBootstrapToken', () => {
    it('throws 403 when config.BOOTSTRAP_TOKEN is not set', () => {
      mockConfig.BOOTSTRAP_TOKEN = undefined;

      expect(() => validateBootstrapToken('any-token')).toThrow(HTTPException);
      try {
        validateBootstrapToken('any-token');
      } catch (e) {
        expect((e as HTTPException).status).toBe(403);
      }
    });

    it('throws 403 when provided token does not match config.BOOTSTRAP_TOKEN', () => {
      mockConfig.BOOTSTRAP_TOKEN = 'correct-secret-token-that-is-long-enough';

      expect(() => validateBootstrapToken('wrong-token')).toThrow(HTTPException);
      try {
        validateBootstrapToken('wrong-token');
      } catch (e) {
        expect((e as HTTPException).status).toBe(403);
      }
    });

    it('throws 403 when no token is provided', () => {
      mockConfig.BOOTSTRAP_TOKEN = 'correct-secret-token-that-is-long-enough';

      expect(() => validateBootstrapToken(undefined)).toThrow(HTTPException);
      expect(() => validateBootstrapToken(null)).toThrow(HTTPException);
    });

    it('passes when provided token matches config.BOOTSTRAP_TOKEN', () => {
      mockConfig.BOOTSTRAP_TOKEN = 'correct-secret-token-that-is-long-enough';

      expect(() =>
        validateBootstrapToken('correct-secret-token-that-is-long-enough'),
      ).not.toThrow();
    });
  });
});
