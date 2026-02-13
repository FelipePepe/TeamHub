import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockSelect,
  mockInsert,
  mockUpdate,
  mockDelete,
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
  const mockDelete = vi.fn();

  return {
    mockSelect,
    mockInsert,
    mockUpdate,
    mockDelete,
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
    delete: mockDelete,
  },
}));

vi.mock('../../db/schema/plantillas.js', () => ({
  plantillasOnboarding: {
    id: 'id',
    departamentoId: 'departamentoId',
    deletedAt: 'deletedAt',
  },
  tareasPlantilla: {
    id: 'id',
    plantillaId: 'plantillaId',
  },
}));

import {
  listPlantillas,
  findPlantillaById,
  createPlantilla,
  updatePlantillaById,
  listTareasByPlantillaId,
  findTareaById,
  createTareaPlantilla,
  updateTareaPlantillaById,
  deleteTareaPlantillaById,
} from '../plantillas-repository.js';

describe('plantillas-repository', () => {
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

  describe('listPlantillas', () => {
    it('should list plantillas with no filters (undefined) - defaults to isNull deletedAt', async () => {
      const mockPlantillas = [{ id: 'pl1', nombre: 'Plantilla 1' }];
      // When filters is undefined, the code adds isNull(deletedAt) and calls where()
      mockWhere.mockResolvedValue(mockPlantillas);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listPlantillas();

      expect(result).toEqual(mockPlantillas);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });

    it('should filter by departamentoId', async () => {
      const mockPlantillas = [{ id: 'pl1', departamentoId: 'd1' }];
      mockWhere.mockResolvedValue(mockPlantillas);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listPlantillas({ departamentoId: 'd1' });

      expect(result).toEqual(mockPlantillas);
      expect(mockWhere).toHaveBeenCalled();
    });

    it('should filter by activo=true (isNull deletedAt)', async () => {
      const mockPlantillas = [{ id: 'pl1', deletedAt: null }];
      mockWhere.mockResolvedValue(mockPlantillas);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listPlantillas({ activo: true });

      expect(result).toEqual(mockPlantillas);
      expect(mockWhere).toHaveBeenCalled();
    });

    it('should filter by activo=false (isNotNull deletedAt)', async () => {
      const mockPlantillas = [{ id: 'pl2', deletedAt: new Date() }];
      mockWhere.mockResolvedValue(mockPlantillas);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listPlantillas({ activo: false });

      expect(result).toEqual(mockPlantillas);
      expect(mockWhere).toHaveBeenCalled();
    });

    it('should apply activo=undefined as isNull deletedAt by default', async () => {
      const mockPlantillas = [{ id: 'pl1' }];
      mockWhere.mockResolvedValue(mockPlantillas);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listPlantillas({ activo: undefined });

      expect(result).toEqual(mockPlantillas);
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe('findPlantillaById', () => {
    it('should return a plantilla when found', async () => {
      const mockPlantilla = { id: 'pl1', nombre: 'Plantilla 1' };
      setupSelectChain([mockPlantilla]);

      const result = await findPlantillaById('pl1');

      expect(result).toEqual(mockPlantilla);
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should return null when not found', async () => {
      setupSelectChain([]);

      const result = await findPlantillaById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createPlantilla', () => {
    it('should return the created plantilla', async () => {
      const payload = { nombre: 'New Plantilla', departamentoId: 'd1' };
      const created = { id: 'pl2', ...payload };
      setupInsertChain([created]);

      const result = await createPlantilla(payload as any);

      expect(result).toEqual(created);
      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(payload);
    });
  });

  describe('updatePlantillaById', () => {
    it('should return the updated plantilla', async () => {
      const payload = { nombre: 'Updated Plantilla' };
      const updated = { id: 'pl1', nombre: 'Updated Plantilla' };
      setupUpdateChain([updated]);

      const result = await updatePlantillaById('pl1', payload as any);

      expect(result).toEqual(updated);
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(payload);
    });
  });

  describe('listTareasByPlantillaId', () => {
    it('should return tareas for a plantilla', async () => {
      const mockTareas = [
        { id: 't1', plantillaId: 'pl1', titulo: 'Tarea 1' },
        { id: 't2', plantillaId: 'pl1', titulo: 'Tarea 2' },
      ];
      mockWhere.mockResolvedValue(mockTareas);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listTareasByPlantillaId('pl1');

      expect(result).toEqual(mockTareas);
    });
  });

  describe('findTareaById', () => {
    it('should return a tarea when found', async () => {
      const mockTarea = { id: 't1', titulo: 'Tarea 1' };
      setupSelectChain([mockTarea]);

      const result = await findTareaById('t1');

      expect(result).toEqual(mockTarea);
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should return null when not found', async () => {
      setupSelectChain([]);

      const result = await findTareaById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createTareaPlantilla', () => {
    it('should return the created tarea', async () => {
      const payload = { plantillaId: 'pl1', titulo: 'New Task', orden: 1 };
      const created = { id: 't3', ...payload };
      setupInsertChain([created]);

      const result = await createTareaPlantilla(payload as any);

      expect(result).toEqual(created);
      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(payload);
    });
  });

  describe('updateTareaPlantillaById', () => {
    it('should return the updated tarea', async () => {
      const payload = { titulo: 'Updated Task' };
      const updated = { id: 't1', titulo: 'Updated Task' };
      setupUpdateChain([updated]);

      const result = await updateTareaPlantillaById('t1', payload as any);

      expect(result).toEqual(updated);
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(payload);
    });
  });

  describe('deleteTareaPlantillaById', () => {
    it('should execute delete for the given id', async () => {
      mockWhere.mockResolvedValue(undefined);
      mockDelete.mockReturnValue({ where: mockWhere });

      await deleteTareaPlantillaById('t1');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });
  });
});
