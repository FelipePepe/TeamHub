import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockSelect,
  mockInsert,
  mockUpdate,
  mockDelete,
  mockFrom,
  mockWhere,
  mockLimit,
  mockOffset,
  mockValues,
  mockReturning,
  mockSet,
} = vi.hoisted(() => {
  const mockReturning = vi.fn();
  const mockLimit = vi.fn();
  const mockOffset = vi.fn();
  const mockWhere = vi.fn();
  const mockFrom = vi.fn();
  const mockSet = vi.fn();
  const mockValues = vi.fn();
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();

  return {
    mockSelect,
    mockInsert,
    mockUpdate,
    mockDelete,
    mockFrom,
    mockWhere,
    mockLimit,
    mockOffset,
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
    delete: mockDelete,
  },
}));

vi.mock('../../db/schema/timetracking.js', () => ({
  timetracking: {
    id: 'id',
    usuarioId: 'usuarioId',
    proyectoId: 'proyectoId',
    estado: 'estado',
    facturable: 'facturable',
    fecha: 'fecha',
  },
}));

import {
  listTimetracking,
  findTimetrackingById,
  createTimetracking,
  updateTimetrackingById,
  deleteTimetrackingById,
} from '../timetracking-repository.js';

describe('timetracking-repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupSelectChain = (result: unknown[]) => {
    mockLimit.mockResolvedValue(result);
    mockWhere.mockReturnValue({ limit: mockLimit });
    mockFrom.mockReturnValue({ where: mockWhere, limit: mockLimit });
    mockSelect.mockReturnValue({ from: mockFrom });
  };

  const setupInsertChain = (result: unknown[]) => {
    mockReturning.mockResolvedValue(result);
    mockValues.mockReturnValue({ returning: mockReturning });
    mockInsert.mockReturnValue({ values: mockValues });
  };

  const setupUpdateChain = (result: unknown[]) => {
    mockReturning.mockResolvedValue(result);
    mockWhere.mockReturnValue({ returning: mockReturning });
    mockSet.mockReturnValue({ where: mockWhere });
    mockUpdate.mockReturnValue({ set: mockSet });
  };

  describe('listTimetracking', () => {
    it('should list timetracking entries with no filters and no pagination', async () => {
      const mockEntries = [{ id: 'tt1' }, { id: 'tt2' }];
      // No clauses => no where, returns from() directly
      mockFrom.mockResolvedValue(mockEntries);
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listTimetracking();

      expect(result).toEqual(mockEntries);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
    });

    it('should filter by usuarioId', async () => {
      const mockEntries = [{ id: 'tt1', usuarioId: 'u1' }];
      mockWhere.mockResolvedValue(mockEntries);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listTimetracking({ usuarioId: 'u1' });

      expect(result).toEqual(mockEntries);
      expect(mockWhere).toHaveBeenCalled();
    });

    it('should filter by proyectoId', async () => {
      const mockEntries = [{ id: 'tt1', proyectoId: 'p1' }];
      mockWhere.mockResolvedValue(mockEntries);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listTimetracking({ proyectoId: 'p1' });

      expect(result).toEqual(mockEntries);
    });

    it('should filter by estado', async () => {
      const mockEntries = [{ id: 'tt1', estado: 'APROBADO' }];
      mockWhere.mockResolvedValue(mockEntries);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listTimetracking({ estado: 'APROBADO' });

      expect(result).toEqual(mockEntries);
    });

    it('should filter by facturable', async () => {
      const mockEntries = [{ id: 'tt1', facturable: true }];
      mockWhere.mockResolvedValue(mockEntries);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listTimetracking({ facturable: true });

      expect(result).toEqual(mockEntries);
    });

    it('should filter by fechaInicio', async () => {
      const mockEntries = [{ id: 'tt1' }];
      mockWhere.mockResolvedValue(mockEntries);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listTimetracking({ fechaInicio: '2024-01-01' });

      expect(result).toEqual(mockEntries);
    });

    it('should filter by fechaFin', async () => {
      const mockEntries = [{ id: 'tt1' }];
      mockWhere.mockResolvedValue(mockEntries);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listTimetracking({ fechaFin: '2024-12-31' });

      expect(result).toEqual(mockEntries);
    });

    it('should apply pagination when page and limit are provided', async () => {
      const mockEntries = [{ id: 'tt1' }];
      // With pagination: baseQuery.limit(limit).offset(offset)
      mockOffset.mockResolvedValue(mockEntries);
      mockLimit.mockReturnValue({ offset: mockOffset });
      mockFrom.mockReturnValue({ where: mockWhere, limit: mockLimit });
      mockWhere.mockReturnValue({ limit: mockLimit });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listTimetracking({ usuarioId: 'u1' }, { page: 2, limit: 10 });

      expect(result).toEqual(mockEntries);
      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(mockOffset).toHaveBeenCalledWith(10); // (2-1) * 10
    });

    it('should not apply pagination when pagination object is absent', async () => {
      const mockEntries = [{ id: 'tt1' }];
      mockWhere.mockResolvedValue(mockEntries);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listTimetracking({ usuarioId: 'u1' });

      expect(result).toEqual(mockEntries);
      expect(mockOffset).not.toHaveBeenCalled();
    });
  });

  describe('findTimetrackingById', () => {
    it('should return a timetracking entry when found', async () => {
      const mockEntry = { id: 'tt1', descripcion: 'Work' };
      setupSelectChain([mockEntry]);

      const result = await findTimetrackingById('tt1');

      expect(result).toEqual(mockEntry);
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should return null when not found', async () => {
      setupSelectChain([]);

      const result = await findTimetrackingById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createTimetracking', () => {
    it('should return the created timetracking entry', async () => {
      const payload = { usuarioId: 'u1', proyectoId: 'p1', horas: 8 };
      const created = { id: 'tt2', ...payload };
      setupInsertChain([created]);

      const result = await createTimetracking(payload as any);

      expect(result).toEqual(created);
      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(payload);
    });
  });

  describe('updateTimetrackingById', () => {
    it('should return the updated timetracking entry', async () => {
      const payload = { horas: 6 };
      const updated = { id: 'tt1', horas: 6 };
      setupUpdateChain([updated]);

      const result = await updateTimetrackingById('tt1', payload as any);

      expect(result).toEqual(updated);
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(payload);
    });
  });

  describe('deleteTimetrackingById', () => {
    it('should execute delete for the given id', async () => {
      mockWhere.mockResolvedValue(undefined);
      mockDelete.mockReturnValue({ where: mockWhere });

      await deleteTimetrackingById('tt1');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });
  });
});
