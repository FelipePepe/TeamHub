import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HTTPException } from 'hono/http-exception';

import {
  isPrivilegedUser,
  requireSelfOrPrivileged,
  buildUserFilters,
} from '../helpers.js';
import type { User } from '../../../db/schema/users.js';

// ── Helpers ─────────────────────────────────────────────────────────
const createMockUser = (overrides: Partial<User> = {}): User =>
  ({
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
  }) as User;

// ── Tests ───────────────────────────────────────────────────────────
describe('usuarios/helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── isPrivilegedUser ──────────────────────────────────────────────
  describe('isPrivilegedUser', () => {
    it('returns true for ADMIN role', () => {
      const user = createMockUser({ rol: 'ADMIN' });
      expect(isPrivilegedUser(user)).toBe(true);
    });

    it('returns true for RRHH role', () => {
      const user = createMockUser({ rol: 'RRHH' });
      expect(isPrivilegedUser(user)).toBe(true);
    });

    it('returns false for EMPLEADO role', () => {
      const user = createMockUser({ rol: 'EMPLEADO' });
      expect(isPrivilegedUser(user)).toBe(false);
    });

    it('returns false for MANAGER role', () => {
      const user = createMockUser({ rol: 'MANAGER' });
      expect(isPrivilegedUser(user)).toBe(false);
    });
  });

  // ── requireSelfOrPrivileged ───────────────────────────────────────
  describe('requireSelfOrPrivileged', () => {
    const targetId = '660e8400-e29b-41d4-a716-446655440001';

    it('does not throw when the user is accessing their own resource', () => {
      const user = createMockUser({ id: targetId, rol: 'EMPLEADO' });

      expect(() => requireSelfOrPrivileged(user, targetId)).not.toThrow();
    });

    it('does not throw when the user is ADMIN accessing another user', () => {
      const user = createMockUser({ rol: 'ADMIN' });

      expect(() => requireSelfOrPrivileged(user, targetId)).not.toThrow();
    });

    it('does not throw when the user is RRHH accessing another user', () => {
      const user = createMockUser({ rol: 'RRHH' });

      expect(() => requireSelfOrPrivileged(user, targetId)).not.toThrow();
    });

    it('throws 403 when non-privileged user accesses another user', () => {
      const user = createMockUser({ rol: 'EMPLEADO' });

      expect(() => requireSelfOrPrivileged(user, targetId)).toThrow(HTTPException);
      try {
        requireSelfOrPrivileged(user, targetId);
      } catch (e) {
        expect((e as HTTPException).status).toBe(403);
      }
    });

    it('throws 403 when MANAGER accesses another user', () => {
      const user = createMockUser({ rol: 'MANAGER' });

      expect(() => requireSelfOrPrivileged(user, targetId)).toThrow(HTTPException);
      try {
        requireSelfOrPrivileged(user, targetId);
      } catch (e) {
        expect((e as HTTPException).status).toBe(403);
      }
    });
  });

  // ── buildUserFilters ──────────────────────────────────────────────
  describe('buildUserFilters', () => {
    it('returns an empty array when query has no filter fields', () => {
      const filters = buildUserFilters({});
      expect(filters).toEqual([]);
    });

    it('adds a search filter (ilike on email or nombre) when search is provided', () => {
      const filters = buildUserFilters({ search: 'john' });
      expect(filters).toHaveLength(1);
      // The filter is an OR of two ilike conditions
      expect(filters[0]).toBeDefined();
    });

    it('adds a rol filter when rol is provided', () => {
      const filters = buildUserFilters({ rol: 'ADMIN' });
      expect(filters).toHaveLength(1);
      expect(filters[0]).toBeDefined();
    });

    it('adds a departamentoId filter when departamentoId is provided', () => {
      const deptId = '550e8400-e29b-41d4-a716-446655440000';
      const filters = buildUserFilters({ departamentoId: deptId });
      expect(filters).toHaveLength(1);
      expect(filters[0]).toBeDefined();
    });

    it('adds a managerId filter when managerId is provided', () => {
      const mgrId = '550e8400-e29b-41d4-a716-446655440000';
      const filters = buildUserFilters({ managerId: mgrId });
      expect(filters).toHaveLength(1);
      expect(filters[0]).toBeDefined();
    });

    it('adds isNull(deletedAt) filter when activo is true', () => {
      const filters = buildUserFilters({ activo: true });
      expect(filters).toHaveLength(1);
      expect(filters[0]).toBeDefined();
    });

    it('adds isNotNull(deletedAt) filter when activo is false', () => {
      const filters = buildUserFilters({ activo: false });
      expect(filters).toHaveLength(1);
      expect(filters[0]).toBeDefined();
    });

    it('builds all filters when all query fields are provided', () => {
      const filters = buildUserFilters({
        search: 'test',
        rol: 'EMPLEADO',
        departamentoId: '550e8400-e29b-41d4-a716-446655440000',
        managerId: '660e8400-e29b-41d4-a716-446655440001',
        activo: true,
      });
      // search + rol + departamentoId + managerId + activo = 5
      expect(filters).toHaveLength(5);
      filters.forEach((filter) => {
        expect(filter).toBeDefined();
      });
    });

    it('does not add activo filter when activo is undefined', () => {
      const filters = buildUserFilters({ activo: undefined });
      expect(filters).toHaveLength(0);
    });
  });
});
