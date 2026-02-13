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

vi.mock('../../db/schema/proyectos.js', () => ({
  proyectos: {
    id: 'id',
    estado: 'estado',
    managerId: 'managerId',
    cliente: 'cliente',
    fechaInicio: 'fechaInicio',
    codigo: 'codigo',
    deletedAt: 'deletedAt',
  },
  asignaciones: {
    id: 'id',
    proyectoId: 'proyectoId',
    usuarioId: 'usuarioId',
    deletedAt: 'deletedAt',
  },
}));

import {
  listProyectos,
  findProyectoById,
  findProyectoByCodigo,
  createProyecto,
  updateProyectoById,
  listAsignacionesByProyectoId,
  listAsignacionesByUsuarioId,
  findAsignacionById,
  createAsignacion,
  updateAsignacionById,
} from '../proyectos-repository.js';

describe('proyectos-repository', () => {
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

  describe('listProyectos', () => {
    it('should list proyectos with no filters (always has deletedAt clause)', async () => {
      const mockProyectos = [{ id: 'p1', nombre: 'Proyecto 1' }];
      // listProyectos always adds isNull(deletedAt) so it always calls where()
      mockWhere.mockResolvedValue(mockProyectos);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listProyectos();

      expect(result).toEqual(mockProyectos);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });

    it('should filter by estado', async () => {
      const mockProyectos = [{ id: 'p1', estado: 'ACTIVO' }];
      mockWhere.mockResolvedValue(mockProyectos);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listProyectos({ estado: 'ACTIVO' });

      expect(result).toEqual(mockProyectos);
      expect(mockWhere).toHaveBeenCalled();
    });

    it('should filter by managerId', async () => {
      const mockProyectos = [{ id: 'p1', managerId: 'u1' }];
      mockWhere.mockResolvedValue(mockProyectos);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listProyectos({ managerId: 'u1' });

      expect(result).toEqual(mockProyectos);
    });

    it('should filter by cliente', async () => {
      const mockProyectos = [{ id: 'p1', cliente: 'Acme' }];
      mockWhere.mockResolvedValue(mockProyectos);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listProyectos({ cliente: 'Acme' });

      expect(result).toEqual(mockProyectos);
    });

    it('should filter by fechaInicio', async () => {
      const mockProyectos = [{ id: 'p1' }];
      mockWhere.mockResolvedValue(mockProyectos);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listProyectos({ fechaInicio: '2024-01-01' });

      expect(result).toEqual(mockProyectos);
    });

    it('should filter by fechaFin', async () => {
      const mockProyectos = [{ id: 'p1' }];
      mockWhere.mockResolvedValue(mockProyectos);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listProyectos({ fechaFin: '2024-12-31' });

      expect(result).toEqual(mockProyectos);
    });

    it('should apply all filters combined', async () => {
      const mockProyectos = [{ id: 'p1' }];
      mockWhere.mockResolvedValue(mockProyectos);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listProyectos({
        estado: 'ACTIVO',
        managerId: 'u1',
        cliente: 'Acme',
        fechaInicio: '2024-01-01',
        fechaFin: '2024-12-31',
      });

      expect(result).toEqual(mockProyectos);
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe('findProyectoById', () => {
    it('should return a proyecto when found', async () => {
      const mockProyecto = { id: 'p1', nombre: 'Proyecto 1' };
      setupSelectChain([mockProyecto]);

      const result = await findProyectoById('p1');

      expect(result).toEqual(mockProyecto);
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should return null when not found', async () => {
      setupSelectChain([]);

      const result = await findProyectoById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findProyectoByCodigo', () => {
    it('should return a proyecto when found', async () => {
      const mockProyecto = { id: 'p1', codigo: 'PRJ-001' };
      setupSelectChain([mockProyecto]);

      const result = await findProyectoByCodigo('PRJ-001');

      expect(result).toEqual(mockProyecto);
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should return null when not found', async () => {
      setupSelectChain([]);

      const result = await findProyectoByCodigo('NONEXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('createProyecto', () => {
    it('should return the created proyecto', async () => {
      const payload = { nombre: 'New Project', codigo: 'NP-001', estado: 'PLANIFICACION' as const };
      const created = { id: 'p2', ...payload };
      setupInsertChain([created]);

      const result = await createProyecto(payload as any);

      expect(result).toEqual(created);
      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(payload);
    });
  });

  describe('updateProyectoById', () => {
    it('should return the updated proyecto', async () => {
      const payload = { nombre: 'Updated Project' };
      const updated = { id: 'p1', nombre: 'Updated Project' };
      setupUpdateChain([updated]);

      const result = await updateProyectoById('p1', payload);

      expect(result).toEqual(updated);
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(payload);
    });
  });

  describe('listAsignacionesByProyectoId', () => {
    it('should return asignaciones for a proyecto', async () => {
      const mockAsignaciones = [{ id: 'a1', proyectoId: 'p1', usuarioId: 'u1' }];
      mockWhere.mockResolvedValue(mockAsignaciones);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listAsignacionesByProyectoId('p1');

      expect(result).toEqual(mockAsignaciones);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe('listAsignacionesByUsuarioId', () => {
    it('should return asignaciones for a user', async () => {
      const mockAsignaciones = [{ id: 'a1', proyectoId: 'p1', usuarioId: 'u1' }];
      mockWhere.mockResolvedValue(mockAsignaciones);
      mockFrom.mockReturnValue({ where: mockWhere });
      mockSelect.mockReturnValue({ from: mockFrom });

      const result = await listAsignacionesByUsuarioId('u1');

      expect(result).toEqual(mockAsignaciones);
    });
  });

  describe('findAsignacionById', () => {
    it('should return an asignacion when found', async () => {
      const mockAsig = { id: 'a1', proyectoId: 'p1', usuarioId: 'u1' };
      setupSelectChain([mockAsig]);

      const result = await findAsignacionById('a1');

      expect(result).toEqual(mockAsig);
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should return null when not found', async () => {
      setupSelectChain([]);

      const result = await findAsignacionById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createAsignacion', () => {
    it('should return the created asignacion', async () => {
      const payload = { proyectoId: 'p1', usuarioId: 'u1', rol: 'DEVELOPER' };
      const created = { id: 'a2', ...payload };
      setupInsertChain([created]);

      const result = await createAsignacion(payload as any);

      expect(result).toEqual(created);
      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(payload);
    });
  });

  describe('updateAsignacionById', () => {
    it('should return the updated asignacion', async () => {
      const payload = { rol: 'LEAD' };
      const updated = { id: 'a1', proyectoId: 'p1', usuarioId: 'u1', rol: 'LEAD' };
      setupUpdateChain([updated]);

      const result = await updateAsignacionById('a1', payload as any);

      expect(result).toEqual(updated);
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(payload);
    });
  });
});
