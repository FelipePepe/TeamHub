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
  mockTransaction,
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
  const mockTransaction = vi.fn();

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
    mockTransaction,
  };
});

vi.mock('../../db/index.js', () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    transaction: mockTransaction,
  },
}));

vi.mock('../../db/schema/procesos.js', () => ({
  procesosOnboarding: {
    id: 'id',
    estado: 'estado',
    empleadoId: 'empleadoId',
    deletedAt: 'deletedAt',
  },
  tareasOnboarding: {
    id: 'id',
    procesoId: 'procesoId',
    orden: 'orden',
  },
}));

import {
  listProcesos,
  findProcesoById,
  createProceso,
  updateProcesoById,
  listTareasByProcesoId,
  findTareaOnboardingById,
  createTareasOnboarding,
  updateTareaOnboardingById,
  updateTareasOrden,
  listTareasByIds,
} from '../procesos-repository.js';

describe('procesos-repository', () => {
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

  describe('listProcesos', () => {
    it('should list procesos with no filters (always has deletedAt clause)', async () => {
      const mockProcesos = [{ id: 'pr1', estado: 'EN_CURSO' }];
      mockWhere.mockResolvedValue(mockProcesos);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listProcesos();

      expect(result).toEqual(mockProcesos);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });

    it('should filter by estado', async () => {
      const mockProcesos = [{ id: 'pr1', estado: 'COMPLETADO' }];
      mockWhere.mockResolvedValue(mockProcesos);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listProcesos({ estado: 'COMPLETADO' });

      expect(result).toEqual(mockProcesos);
    });

    it('should filter by empleadoId', async () => {
      const mockProcesos = [{ id: 'pr1', empleadoId: 'u1' }];
      mockWhere.mockResolvedValue(mockProcesos);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listProcesos({ empleadoId: 'u1' });

      expect(result).toEqual(mockProcesos);
    });

    it('should filter by both estado and empleadoId', async () => {
      const mockProcesos = [{ id: 'pr1', estado: 'EN_CURSO', empleadoId: 'u1' }];
      mockWhere.mockResolvedValue(mockProcesos);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listProcesos({ estado: 'EN_CURSO', empleadoId: 'u1' });

      expect(result).toEqual(mockProcesos);
    });
  });

  describe('findProcesoById', () => {
    it('should return a proceso when found', async () => {
      const mockProceso = { id: 'pr1', estado: 'EN_CURSO' };
      setupSelectChain([mockProceso]);

      const result = await findProcesoById('pr1');

      expect(result).toEqual(mockProceso);
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should return null when not found', async () => {
      setupSelectChain([]);

      const result = await findProcesoById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createProceso', () => {
    it('should return the created proceso', async () => {
      const payload = { empleadoId: 'u1', estado: 'EN_CURSO' };
      const created = { id: 'pr2', ...payload };
      setupInsertChain([created]);

      const result = await createProceso(payload as any);

      expect(result).toEqual(created);
      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(payload);
    });
  });

  describe('updateProcesoById', () => {
    it('should return the updated proceso', async () => {
      const payload = { estado: 'COMPLETADO' };
      const updated = { id: 'pr1', estado: 'COMPLETADO' };
      setupUpdateChain([updated]);

      const result = await updateProcesoById('pr1', payload as any);

      expect(result).toEqual(updated);
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(payload);
    });
  });

  describe('listTareasByProcesoId', () => {
    it('should return tareas for a proceso', async () => {
      const mockTareas = [
        { id: 't1', procesoId: 'pr1', titulo: 'Tarea 1' },
        { id: 't2', procesoId: 'pr1', titulo: 'Tarea 2' },
      ];
      mockWhere.mockResolvedValue(mockTareas);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listTareasByProcesoId('pr1');

      expect(result).toEqual(mockTareas);
    });
  });

  describe('findTareaOnboardingById', () => {
    it('should return a tarea when found', async () => {
      const mockTarea = { id: 't1', titulo: 'Tarea 1' };
      setupSelectChain([mockTarea]);

      const result = await findTareaOnboardingById('t1');

      expect(result).toEqual(mockTarea);
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should return null when not found', async () => {
      setupSelectChain([]);

      const result = await findTareaOnboardingById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createTareasOnboarding', () => {
    it('should return created tareas when payload has items', async () => {
      const payload = [
        { procesoId: 'pr1', titulo: 'Tarea 1', orden: 1 },
        { procesoId: 'pr1', titulo: 'Tarea 2', orden: 2 },
      ];
      const created = [
        { id: 't1', ...payload[0] },
        { id: 't2', ...payload[1] },
      ];
      setupInsertChain(created);

      const result = await createTareasOnboarding(payload as any);

      expect(result).toEqual(created);
      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(payload);
    });

    it('should return empty array when payload is empty', async () => {
      const result = await createTareasOnboarding([]);

      expect(result).toEqual([]);
      expect(mockInsert).not.toHaveBeenCalled();
    });
  });

  describe('updateTareaOnboardingById', () => {
    it('should return the updated tarea', async () => {
      const payload = { titulo: 'Updated Task' };
      const updated = { id: 't1', titulo: 'Updated Task' };
      setupUpdateChain([updated]);

      const result = await updateTareaOnboardingById('t1', payload as any);

      expect(result).toEqual(updated);
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(payload);
    });
  });

  describe('updateTareasOrden', () => {
    it('should call transaction with update for each id when orderedIds has items', async () => {
      const txMockWhere = vi.fn().mockResolvedValue(undefined);
      const txMockSet = vi.fn().mockReturnValue({ where: txMockWhere });
      const txMockUpdate = vi.fn().mockReturnValue({ set: txMockSet });
      const txMock = { update: txMockUpdate };

      mockTransaction.mockImplementation(async (fn: (tx: typeof txMock) => Promise<void>) => {
        await fn(txMock);
      });

      await updateTareasOrden('pr1', ['t1', 't2', 't3']);

      expect(mockTransaction).toHaveBeenCalled();
      expect(txMockUpdate).toHaveBeenCalledTimes(3);
      expect(txMockSet).toHaveBeenCalledTimes(3);
    });

    it('should return early when orderedIds is empty', async () => {
      await updateTareasOrden('pr1', []);

      expect(mockTransaction).not.toHaveBeenCalled();
    });
  });

  describe('listTareasByIds', () => {
    it('should return tareas for given ids', async () => {
      const mockTareas = [
        { id: 't1', titulo: 'Tarea 1' },
        { id: 't2', titulo: 'Tarea 2' },
      ];
      mockWhere.mockResolvedValue(mockTareas);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listTareasByIds(['t1', 't2']);

      expect(result).toEqual(mockTareas);
    });

    it('should return empty array when ids is empty', async () => {
      const result = await listTareasByIds([]);

      expect(result).toEqual([]);
      expect(mockSelect).not.toHaveBeenCalled();
    });
  });
});
