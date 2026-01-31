import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Mock de dependencias antes de importar el servicio
vi.mock('../../config/env.js', () => ({
  config: {
    JWT_ACCESS_SECRET: 'test-access-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
    BCRYPT_SALT_ROUNDS: 10,
  },
}));

// Crear mocks con funciones que persistan usando vi.hoisted
const mockDb = vi.hoisted(() => ({
  insert: vi.fn(() => ({
    values: vi.fn().mockResolvedValue(undefined),
  })),
  update: vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn().mockResolvedValue(undefined),
    })),
  })),
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn().mockResolvedValue([]),
      })),
    })),
  })),
}));

vi.mock('../../db/index.js', () => ({
  db: mockDb,
}));

const mockCreateId = vi.hoisted(() => vi.fn().mockReturnValue('mock-id-123'));

vi.mock('../../store/index.js', () => ({
  createId: mockCreateId,
}));

// Importar después de los mocks
import {
  hashPassword,
  verifyPassword,
  createAccessToken,
  verifyAccessToken,
  createRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokensForUser,
  createMfaToken,
  verifyMfaToken,
  createResetToken,
  findResetTokenRecord,
  markResetTokenUsed,
} from '../auth-service.js';

/**
 * Tests unitarios para auth-service
 * Cobertura objetivo: 80%+
 */
describe('auth-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Password Hashing Tests
  // ============================================================================
  describe('hashPassword', () => {
    it('debe generar un hash diferente al password original', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[aby]?\$\d+\$/); // Formato bcrypt
    });

    it('debe generar hashes diferentes para el mismo password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // Diferentes salts
    });

    it('debe generar un hash verificable', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const isValid = await bcrypt.compare(password, hash);

      expect(isValid).toBe(true);
    });
  });

  describe('verifyPassword', () => {
    it('debe retornar true para password correcto', async () => {
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 10);

      const result = await verifyPassword(password, hash);

      expect(result).toBe(true);
    });

    it('debe retornar false para password incorrecto', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hash = await bcrypt.hash(password, 10);

      const result = await verifyPassword(wrongPassword, hash);

      expect(result).toBe(false);
    });

    it('debe retornar false para hash inválido', async () => {
      const password = 'TestPassword123!';
      const invalidHash = 'invalid-hash';

      const result = await verifyPassword(password, invalidHash);

      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Access Token Tests
  // ============================================================================
  describe('createAccessToken', () => {
    it('debe crear un token JWT válido', () => {
      const user = { id: 'user-123', rol: 'ADMIN' };

      const token = createAccessToken(user);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // Header.Payload.Signature
    });

    it('debe incluir el payload correcto', () => {
      const user = { id: 'user-123', rol: 'MANAGER' };

      const token = createAccessToken(user);
      const decoded = jwt.decode(token) as { sub: string; role: string };

      expect(decoded.sub).toBe('user-123');
      expect(decoded.role).toBe('MANAGER');
    });

    it('debe ser verificable con el secret correcto', () => {
      const user = { id: 'user-123', rol: 'EMPLEADO' };

      const token = createAccessToken(user);
      const verified = jwt.verify(token, 'test-access-secret') as { sub: string };

      expect(verified.sub).toBe('user-123');
    });
  });

  describe('verifyAccessToken', () => {
    it('debe verificar un token válido', () => {
      const user = { id: 'user-123', rol: 'ADMIN' };
      const token = createAccessToken(user);

      const payload = verifyAccessToken(token);

      expect(payload.sub).toBe('user-123');
      expect(payload.role).toBe('ADMIN');
    });

    it('debe lanzar error para token inválido', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyAccessToken(invalidToken)).toThrow();
    });

    it('debe lanzar error para token expirado', () => {
      const expiredToken = jwt.sign(
        { sub: 'user-123', role: 'ADMIN' },
        'test-access-secret',
        { expiresIn: '-1s' }
      );

      expect(() => verifyAccessToken(expiredToken)).toThrow();
    });

    it('debe lanzar error para token con type (no es access token)', () => {
      const tokenWithType = jwt.sign(
        { sub: 'user-123', role: 'ADMIN', type: 'refresh' },
        'test-access-secret'
      );

      expect(() => verifyAccessToken(tokenWithType)).toThrow('Invalid access token');
    });
  });

  // ============================================================================
  // Refresh Token Tests
  // ============================================================================
  describe('createRefreshToken', () => {
    it('debe crear un token con tipo refresh', async () => {
      const user = { id: 'user-123', rol: 'ADMIN' };
      // Resetear el mock para este test
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const token = await createRefreshToken(user);
      const decoded = jwt.decode(token) as { type: string };

      expect(decoded.type).toBe('refresh');
    });

    it('debe almacenar el token en la base de datos', async () => {
      const user = { id: 'user-123', rol: 'ADMIN' };
      const mockValues = vi.fn().mockResolvedValue(undefined);
      mockDb.insert.mockReturnValue({
        values: mockValues,
      });

      await createRefreshToken(user);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalled();
    });

    it('debe retornar un token JWT válido con sub correcto', async () => {
      const user = { id: 'user-456', rol: 'MANAGER' };
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const token = await createRefreshToken(user);
      const decoded = jwt.decode(token) as { sub: string; type: string };

      expect(decoded.sub).toBe('user-456');
      expect(decoded.type).toBe('refresh');
    });
  });

  describe('revokeRefreshToken', () => {
    it('debe actualizar el token con revokedAt', async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      mockDb.update.mockReturnValue({ set: mockSet });

      const token = jwt.sign(
        { sub: 'user-123', type: 'refresh', jti: 'token-id' },
        'test-refresh-secret'
      );

      await revokeRefreshToken(token);

      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe('revokeAllRefreshTokensForUser', () => {
    it('debe revocar todos los tokens del usuario', async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      mockDb.update.mockReturnValue({ set: mockSet });

      await revokeAllRefreshTokensForUser('user-123');

      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // MFA Token Tests
  // ============================================================================
  describe('createMfaToken', () => {
    it('debe crear un token con tipo mfa', () => {
      const user = { id: 'user-123', rol: 'ADMIN' };

      const token = createMfaToken(user);
      const decoded = jwt.decode(token) as { type: string };

      expect(decoded.type).toBe('mfa');
    });

    it('debe incluir el id de usuario', () => {
      const user = { id: 'user-456', rol: 'EMPLEADO' };

      const token = createMfaToken(user);
      const decoded = jwt.decode(token) as { sub: string };

      expect(decoded.sub).toBe('user-456');
    });
  });

  describe('verifyMfaToken', () => {
    it('debe verificar un token MFA válido', () => {
      const user = { id: 'user-123', rol: 'ADMIN' };
      const token = createMfaToken(user);

      const payload = verifyMfaToken(token);

      expect(payload.sub).toBe('user-123');
      expect(payload.type).toBe('mfa');
    });

    it('debe lanzar error para token inválido', () => {
      const invalidToken = 'invalid.mfa.token';

      expect(() => verifyMfaToken(invalidToken)).toThrow();
    });
  });

  // ============================================================================
  // Reset Token Tests
  // ============================================================================
  describe('createResetToken', () => {
    it('debe crear un token hexadecimal', async () => {
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const user = { id: 'user-123', rol: 'ADMIN' };
      const token = await createResetToken(user);

      expect(token).toMatch(/^[a-f0-9]{64}$/); // 32 bytes = 64 hex chars
    });

    it('debe almacenar el token hasheado en la base de datos', async () => {
      const mockValues = vi.fn().mockResolvedValue(undefined);
      mockDb.insert.mockReturnValue({
        values: mockValues,
      });

      const user = { id: 'user-123', rol: 'ADMIN' };
      await createResetToken(user);

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: 'user-123',
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        })
      );
    });
  });

  describe('findResetTokenRecord', () => {
    it('debe encontrar un token existente', async () => {
      const mockRecord = {
        id: 'record-123',
        usuarioId: 'user-123',
        tokenHash: 'hashed-token',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        usedAt: null,
      };

      const mockLimit = vi.fn().mockResolvedValue([mockRecord]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      mockDb.select.mockReturnValue({ from: mockFrom });

      const result = await findResetTokenRecord('some-token');

      expect(result).toEqual(mockRecord);
    });

    it('debe retornar null para token inexistente', async () => {
      const mockLimit = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      mockDb.select.mockReturnValue({ from: mockFrom });

      const result = await findResetTokenRecord('nonexistent-token');

      expect(result).toBeNull();
    });
  });

  describe('markResetTokenUsed', () => {
    it('debe marcar el token como usado', async () => {
      const mockWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      mockDb.update.mockReturnValue({ set: mockSet });

      await markResetTokenUsed('record-123');

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          usedAt: expect.any(Date),
        })
      );
    });
  });

  // ============================================================================
  // durationToMs Tests (función interna pero probada indirectamente)
  // ============================================================================
  describe('durationToMs (via createRefreshToken)', () => {
    it('debe calcular correctamente la expiración del refresh token', async () => {
      const mockValues = vi.fn().mockResolvedValue(undefined);
      mockDb.insert.mockReturnValue({
        values: mockValues,
      });

      const user = { id: 'user-123', rol: 'ADMIN' };
      await createRefreshToken(user);

      // Verificar que expiresAt está aproximadamente 7 días en el futuro
      const call = mockValues.mock.calls[0][0];
      const expiresAt = call.expiresAt as Date;
      const expectedMs = 7 * 24 * 60 * 60 * 1000; // 7 días
      const actualDiff = expiresAt.getTime() - Date.now();

      // Permitir 1 segundo de tolerancia
      expect(actualDiff).toBeGreaterThan(expectedMs - 1000);
      expect(actualDiff).toBeLessThan(expectedMs + 1000);
    });
  });
});
