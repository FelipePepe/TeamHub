import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockSelect,
  mockInsert,
  mockUpdate,
  mockFrom,
  mockWhere,
  mockLimit,
  mockValues,
  mockReturning,
  mockSet,
} = vi.hoisted(() => {
  const mockReturning = vi.fn();
  const mockLimit = vi.fn();
  const mockWhere = vi.fn();
  const mockFrom = vi.fn();
  const mockSet = vi.fn();
  const mockValues = vi.fn();
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();

  return {
    mockSelect,
    mockInsert,
    mockUpdate,
    mockFrom,
    mockWhere,
    mockLimit,
    mockValues,
    mockReturning,
    mockSet,
  };
});

vi.mock('../../db/index.js', () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
  },
}));

// Mock the schema so imports don't fail
vi.mock('../../db/schema/users.js', () => ({
  users: {
    id: 'id',
    email: 'email',
    deletedAt: 'deletedAt',
  },
}));

import {
  countUsers,
  findUserByEmail,
  findUserById,
  findActiveUserById,
  createUser,
  updateUserById,
} from '../users-repository.js';

describe('users-repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Helper: set up chainable mocks for select().from().where().limit()
   */
  const setupSelectChain = (result: unknown[]) => {
    mockLimit.mockResolvedValue(result);
    mockWhere.mockReturnValue({ limit: mockLimit });
    mockFrom.mockReturnValue({ where: mockWhere, limit: mockLimit });
    mockSelect.mockReturnValue({ from: mockFrom });
  };

  /**
   * Helper: set up chainable mocks for insert().values().returning()
   */
  const setupInsertChain = (result: unknown[]) => {
    mockReturning.mockResolvedValue(result);
    mockValues.mockReturnValue({ returning: mockReturning });
    mockInsert.mockReturnValue({ values: mockValues });
  };

  /**
   * Helper: set up chainable mocks for update().set().where().returning()
   */
  const setupUpdateChain = (result: unknown[]) => {
    mockReturning.mockResolvedValue(result);
    mockWhere.mockReturnValue({ returning: mockReturning });
    mockSet.mockReturnValue({ where: mockWhere });
    mockUpdate.mockReturnValue({ set: mockSet });
  };

  describe('countUsers', () => {
    it('should return the count from the query result', async () => {
      // countUsers uses select().from() without where/limit - from resolves directly
      mockFrom.mockResolvedValue([{ count: 5 }]);
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await countUsers();

      expect(result).toBe(5);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
    });

    it('should return 0 when result is empty', async () => {
      mockFrom.mockResolvedValue([]);
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await countUsers();

      expect(result).toBe(0);
    });

    it('should return 0 when count is undefined', async () => {
      mockFrom.mockResolvedValue([{ count: undefined }]);
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await countUsers();

      expect(result).toBe(0);
    });
  });

  describe('findUserByEmail', () => {
    it('should return a user when found', async () => {
      const mockUser = { id: 'u1', email: 'test@example.com', nombre: 'Test' };
      setupSelectChain([mockUser]);

      const result = await findUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should return null when user is not found', async () => {
      setupSelectChain([]);

      const result = await findUserByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('should return a user when found', async () => {
      const mockUser = { id: 'u1', email: 'test@example.com' };
      setupSelectChain([mockUser]);

      const result = await findUserById('u1');

      expect(result).toEqual(mockUser);
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should return null when user is not found', async () => {
      setupSelectChain([]);

      const result = await findUserById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findActiveUserById', () => {
    it('should return a user when found and not deleted', async () => {
      const mockUser = { id: 'u1', email: 'test@example.com', deletedAt: null };
      setupSelectChain([mockUser]);

      const result = await findActiveUserById('u1');

      expect(result).toEqual(mockUser);
      expect(mockWhere).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should return null when user is not found', async () => {
      setupSelectChain([]);

      const result = await findActiveUserById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should return the created user on success', async () => {
      const payload = { email: 'new@example.com', nombre: 'New', passwordHash: 'hash', rol: 'EMPLEADO' as const };
      const createdUser = { id: 'u2', ...payload };
      setupInsertChain([createdUser]);

      const result = await createUser(payload as any);

      expect(result).toEqual(createdUser);
      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(payload);
      expect(mockReturning).toHaveBeenCalled();
    });

    it('should return null when result is empty', async () => {
      const payload = { email: 'new@example.com', nombre: 'New', passwordHash: 'hash', rol: 'EMPLEADO' as const };
      setupInsertChain([]);

      const result = await createUser(payload as any);

      expect(result).toBeNull();
    });
  });

  describe('updateUserById', () => {
    it('should return the updated user on success', async () => {
      const payload = { nombre: 'Updated Name' };
      const updatedUser = { id: 'u1', email: 'test@example.com', nombre: 'Updated Name' };
      setupUpdateChain([updatedUser]);

      const result = await updateUserById('u1', payload);

      expect(result).toEqual(updatedUser);
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(payload);
      expect(mockWhere).toHaveBeenCalled();
      expect(mockReturning).toHaveBeenCalled();
    });

    it('should return null when user is not found', async () => {
      const payload = { nombre: 'Updated Name' };
      setupUpdateChain([]);

      const result = await updateUserById('nonexistent', payload);

      expect(result).toBeNull();
    });
  });
});
