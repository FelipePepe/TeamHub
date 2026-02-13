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

vi.mock('../../db/schema/departamentos.js', () => ({
  departamentos: {
    id: 'id',
    nombre: 'nombre',
    codigo: 'codigo',
  },
}));

import {
  findDepartamentoById,
  findDepartamentoByNombreOrCodigo,
  findDepartamentoByNombreOrCodigoExcludingId,
  createDepartamento,
  updateDepartamentoById,
} from '../departamentos-repository.js';

describe('departamentos-repository', () => {
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

  describe('findDepartamentoById', () => {
    it('should return a departamento when found', async () => {
      const mockDep = { id: 'd1', nombre: 'Engineering', codigo: 'ENG' };
      setupSelectChain([mockDep]);

      const result = await findDepartamentoById('d1');

      expect(result).toEqual(mockDep);
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should return null when not found', async () => {
      setupSelectChain([]);

      const result = await findDepartamentoById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findDepartamentoByNombreOrCodigo', () => {
    it('should return null when neither nombre nor codigo is provided', async () => {
      const result = await findDepartamentoByNombreOrCodigo(undefined, undefined);

      expect(result).toBeNull();
      expect(mockSelect).not.toHaveBeenCalled();
    });

    it('should query with nombre only', async () => {
      const mockDep = { id: 'd1', nombre: 'Engineering', codigo: 'ENG' };
      setupSelectChain([mockDep]);

      const result = await findDepartamentoByNombreOrCodigo('Engineering', undefined);

      expect(result).toEqual(mockDep);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should query with codigo only', async () => {
      const mockDep = { id: 'd1', nombre: 'Engineering', codigo: 'ENG' };
      setupSelectChain([mockDep]);

      const result = await findDepartamentoByNombreOrCodigo(undefined, 'ENG');

      expect(result).toEqual(mockDep);
      expect(mockSelect).toHaveBeenCalled();
    });

    it('should query with both nombre and codigo', async () => {
      const mockDep = { id: 'd1', nombre: 'Engineering', codigo: 'ENG' };
      setupSelectChain([mockDep]);

      const result = await findDepartamentoByNombreOrCodigo('Engineering', 'ENG');

      expect(result).toEqual(mockDep);
      expect(mockSelect).toHaveBeenCalled();
    });

    it('should return null when not found with nombre', async () => {
      setupSelectChain([]);

      const result = await findDepartamentoByNombreOrCodigo('Nonexistent', undefined);

      expect(result).toBeNull();
    });
  });

  describe('findDepartamentoByNombreOrCodigoExcludingId', () => {
    it('should return null when neither nombre nor codigo is provided', async () => {
      const result = await findDepartamentoByNombreOrCodigoExcludingId(undefined, undefined, 'd1');

      expect(result).toBeNull();
      expect(mockSelect).not.toHaveBeenCalled();
    });

    it('should query with nombre excluding the given id', async () => {
      const mockDep = { id: 'd2', nombre: 'Engineering', codigo: 'ENG2' };
      setupSelectChain([mockDep]);

      const result = await findDepartamentoByNombreOrCodigoExcludingId('Engineering', undefined, 'd1');

      expect(result).toEqual(mockDep);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should query with codigo excluding the given id', async () => {
      const mockDep = { id: 'd2', nombre: 'Other', codigo: 'ENG' };
      setupSelectChain([mockDep]);

      const result = await findDepartamentoByNombreOrCodigoExcludingId(undefined, 'ENG', 'd1');

      expect(result).toEqual(mockDep);
    });

    it('should query with both nombre and codigo excluding the given id', async () => {
      const mockDep = { id: 'd2', nombre: 'Engineering', codigo: 'ENG' };
      setupSelectChain([mockDep]);

      const result = await findDepartamentoByNombreOrCodigoExcludingId('Engineering', 'ENG', 'd1');

      expect(result).toEqual(mockDep);
    });

    it('should return null when no match is found', async () => {
      setupSelectChain([]);

      const result = await findDepartamentoByNombreOrCodigoExcludingId('Nonexistent', undefined, 'd1');

      expect(result).toBeNull();
    });
  });

  describe('createDepartamento', () => {
    it('should return the created departamento on success', async () => {
      const payload = { nombre: 'New Dept', codigo: 'ND' };
      const created = { id: 'd3', ...payload };
      setupInsertChain([created]);

      const result = await createDepartamento(payload as any);

      expect(result).toEqual(created);
      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(payload);
      expect(mockReturning).toHaveBeenCalled();
    });

    it('should return null when result is empty', async () => {
      const payload = { nombre: 'New Dept', codigo: 'ND' };
      setupInsertChain([]);

      const result = await createDepartamento(payload as any);

      expect(result).toBeNull();
    });
  });

  describe('updateDepartamentoById', () => {
    it('should return the updated departamento on success', async () => {
      const payload = { nombre: 'Updated Dept' };
      const updated = { id: 'd1', nombre: 'Updated Dept', codigo: 'ENG' };
      setupUpdateChain([updated]);

      const result = await updateDepartamentoById('d1', payload);

      expect(result).toEqual(updated);
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(payload);
      expect(mockWhere).toHaveBeenCalled();
      expect(mockReturning).toHaveBeenCalled();
    });

    it('should return null when departamento is not found', async () => {
      const payload = { nombre: 'Updated Dept' };
      setupUpdateChain([]);

      const result = await updateDepartamentoById('nonexistent', payload);

      expect(result).toBeNull();
    });
  });
});
