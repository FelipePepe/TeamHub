import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TareasService } from '../tareas.service.js';
import { tareasRepository } from '../tareas-repository.js';
import { findProyectoById } from '../proyectos-repository.js';
import { findActiveUserById } from '../users-repository.js';
import type { User } from '../../db/schema/users.js';
import type { Tarea } from '../../db/schema/tareas.js';
import type { Proyecto } from '../../db/schema/proyectos.js';
import { HTTPException } from 'hono/http-exception';

// Mock de dependencias
vi.mock('../tareas-repository.js');
vi.mock('../proyectos-repository.js');
vi.mock('../users-repository.js');

/**
 * Tests para TareasService (80% Coverage - IMPORTANT)
 * Tests de lógica de negocio, permisos y validaciones
 */
describe('TareasService', () => {
  let service: TareasService;
  let mockAdminUser: User;
  let mockManagerUser: User;
  let mockEmpleadoUser: User;
  let mockTarea: Tarea;

  beforeEach(() => {
    service = new TareasService();
    vi.clearAllMocks();

    mockAdminUser = {
      id: 'admin-1',
      email: 'admin@example.com',
      nombre: 'Admin',
      rol: 'ADMIN',
      activo: true,
    } as User;

    mockManagerUser = {
      id: 'manager-1',
      email: 'manager@example.com',
      nombre: 'Manager',
      rol: 'MANAGER',
      activo: true,
    } as User;

    mockEmpleadoUser = {
      id: 'emp-1',
      email: 'empleado@example.com',
      nombre: 'Empleado',
      rol: 'EMPLEADO',
      activo: true,
    } as User;

    mockTarea = {
      id: 'tarea-1',
      proyectoId: 'proyecto-1',
      titulo: 'Tarea Test',
      descripcion: 'Descripción',
      estado: 'TODO',
      prioridad: 'MEDIUM',
      usuarioAsignadoId: 'emp-1',
      orden: '1',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Tarea;
  });

  describe('listByProyecto', () => {
    it('debe listar tareas del proyecto', async () => {
      vi.mocked(findProyectoById).mockResolvedValue({
        id: 'proyecto-1',
        nombre: 'Proyecto Test',
      } as unknown as Proyecto);
      vi.mocked(tareasRepository.findByProyecto).mockResolvedValue([mockTarea]);

      const result = await service.listByProyecto('proyecto-1', mockAdminUser);

      expect(result).toEqual([mockTarea]);
      expect(findProyectoById).toHaveBeenCalledWith('proyecto-1');
      expect(tareasRepository.findByProyecto).toHaveBeenCalledWith('proyecto-1');
    });

    it('debe lanzar error 404 si el proyecto no existe', async () => {
      vi.mocked(findProyectoById).mockResolvedValue(undefined);

      await expect(
        service.listByProyecto('proyecto-inexistente', mockAdminUser)
      ).rejects.toThrow(HTTPException);
    });
  });

  describe('listByUsuario - Permisos', () => {
    beforeEach(() => {
      vi.mocked(findActiveUserById).mockResolvedValue(mockEmpleadoUser);
      vi.mocked(tareasRepository.findByUsuario).mockResolvedValue([mockTarea]);
    });

    it('ADMIN puede ver tareas de cualquier usuario', async () => {
      const result = await service.listByUsuario('emp-1', mockAdminUser);

      expect(result).toEqual([mockTarea]);
      expect(tareasRepository.findByUsuario).toHaveBeenCalledWith('emp-1');
    });

    it('RRHH puede ver tareas de cualquier usuario', async () => {
      const rrhhUser = { ...mockAdminUser, id: 'rrhh-1', rol: 'RRHH' } as User;
      const result = await service.listByUsuario('emp-1', rrhhUser);

      expect(result).toEqual([mockTarea]);
    });

    it('MANAGER puede ver tareas de cualquier usuario', async () => {
      const result = await service.listByUsuario('emp-1', mockManagerUser);

      expect(result).toEqual([mockTarea]);
    });

    it('EMPLEADO puede ver solo sus propias tareas', async () => {
      const result = await service.listByUsuario('emp-1', mockEmpleadoUser);

      expect(result).toEqual([mockTarea]);
    });

    it('EMPLEADO NO puede ver tareas de otros usuarios', async () => {
      await expect(
        service.listByUsuario('otro-usuario', mockEmpleadoUser)
      ).rejects.toThrow(HTTPException);
    });

    it('debe lanzar error 404 si el usuario no existe', async () => {
      vi.mocked(findActiveUserById).mockResolvedValue(undefined);

      await expect(
        service.listByUsuario('inexistente', mockAdminUser)
      ).rejects.toThrow(HTTPException);
    });
  });

  describe('getById', () => {
    it('debe obtener tarea por ID', async () => {
      vi.mocked(tareasRepository.findById).mockResolvedValue(mockTarea);

      const result = await service.getById('tarea-1', mockAdminUser);

      expect(result).toEqual(mockTarea);
    });

    it('debe lanzar error 404 si la tarea no existe', async () => {
      vi.mocked(tareasRepository.findById).mockResolvedValue(undefined);

      await expect(
        service.getById('inexistente', mockAdminUser)
      ).rejects.toThrow(HTTPException);
    });
  });

  describe('create - Permisos', () => {
    beforeEach(() => {
      vi.mocked(findProyectoById).mockResolvedValue({ id: 'proyecto-1' } as unknown as Proyecto);
      vi.mocked(findActiveUserById).mockResolvedValue(mockEmpleadoUser);
      vi.mocked(tareasRepository.create).mockResolvedValue(mockTarea);
    });

    it('ADMIN puede crear tareas', async () => {
      const data = {
        titulo: 'Nueva Tarea',
        descripcion: 'Descripción',
        estado: 'TODO' as const,
        prioridad: 'MEDIUM' as const,
      };

      const result = await service.create('proyecto-1', data, mockAdminUser);

      expect(result).toEqual(mockTarea);
      expect(tareasRepository.create).toHaveBeenCalled();
    });

    it('MANAGER puede crear tareas', async () => {
      const data = { titulo: 'Nueva Tarea' };

      const result = await service.create('proyecto-1', data, mockManagerUser);

      expect(result).toEqual(mockTarea);
    });

    it('RRHH puede crear tareas', async () => {
      const rrhhUser = { ...mockAdminUser, rol: 'RRHH' } as User;
      const data = { titulo: 'Nueva Tarea' };

      const result = await service.create('proyecto-1', data, rrhhUser);

      expect(result).toEqual(mockTarea);
    });

    it('EMPLEADO NO puede crear tareas', async () => {
      const data = { titulo: 'Nueva Tarea' };

      await expect(
        service.create('proyecto-1', data, mockEmpleadoUser)
      ).rejects.toThrow(HTTPException);
    });
  });

  describe('create - Validaciones', () => {
    beforeEach(() => {
      vi.mocked(findProyectoById).mockResolvedValue({ id: 'proyecto-1' } as unknown as Proyecto);
      vi.mocked(tareasRepository.create).mockResolvedValue(mockTarea);
    });

    it('debe validar que el proyecto existe', async () => {
      vi.mocked(findProyectoById).mockResolvedValue(undefined);

      await expect(
        service.create('proyecto-1', { titulo: 'Test' }, mockAdminUser)
      ).rejects.toThrow(HTTPException);
    });

    it('debe validar que el usuario asignado existe', async () => {
      vi.mocked(findActiveUserById).mockResolvedValue(undefined);

      await expect(
        service.create(
          'proyecto-1',
          { titulo: 'Test', usuarioAsignadoId: 'inexistente' },
          mockAdminUser
        )
      ).rejects.toThrow(HTTPException);
    });

    it('debe validar fechas: fechaFin >= fechaInicio', async () => {
      const data = {
        titulo: 'Test',
        fechaInicio: '2024-12-31',
        fechaFin: '2024-01-01', // Anterior
      };

      await expect(
        service.create('proyecto-1', data, mockAdminUser)
      ).rejects.toThrow(HTTPException);
    });

    it('debe aceptar fechas válidas', async () => {
      const data = {
        titulo: 'Test',
        fechaInicio: '2024-01-01',
        fechaFin: '2024-12-31',
      };

      await service.create('proyecto-1', data, mockAdminUser);

      expect(tareasRepository.create).toHaveBeenCalled();
    });

    it('debe validar dependencia: tarea debe existir', async () => {
      vi.mocked(tareasRepository.findById).mockResolvedValue(undefined);

      await expect(
        service.create(
          'proyecto-1',
          { titulo: 'Test', dependeDe: 'tarea-inexistente' },
          mockAdminUser
        )
      ).rejects.toThrow(HTTPException);
    });

    it('debe validar dependencia: debe ser del mismo proyecto', async () => {
      vi.mocked(tareasRepository.findById).mockResolvedValue({
        ...mockTarea,
        proyectoId: 'otro-proyecto',
      });

      await expect(
        service.create(
          'proyecto-1',
          { titulo: 'Test', dependeDe: 'tarea-otro-proyecto' },
          mockAdminUser
        )
      ).rejects.toThrow(HTTPException);
    });

    it('debe crear tarea con dependencia válida', async () => {
      vi.mocked(tareasRepository.findById).mockResolvedValue(mockTarea);

      await service.create(
        'proyecto-1',
        { titulo: 'Test', dependeDe: 'tarea-1' },
        mockAdminUser
      );

      expect(tareasRepository.create).toHaveBeenCalled();
    });
  });

  describe('update - Permisos', () => {
    beforeEach(() => {
      vi.mocked(tareasRepository.findById).mockResolvedValue(mockTarea);
      vi.mocked(tareasRepository.update).mockResolvedValue(mockTarea);
    });

    it('ADMIN puede actualizar tareas', async () => {
      const result = await service.update('tarea-1', { titulo: 'Nuevo' }, mockAdminUser);

      expect(result).toEqual(mockTarea);
    });

    it('EMPLEADO NO puede actualizar tareas', async () => {
      await expect(
        service.update('tarea-1', { titulo: 'Nuevo' }, mockEmpleadoUser)
      ).rejects.toThrow(HTTPException);
    });
  });

  describe('update - Validaciones', () => {
    beforeEach(() => {
      vi.mocked(tareasRepository.findById).mockResolvedValue(mockTarea);
      vi.mocked(tareasRepository.update).mockResolvedValue(mockTarea);
    });

    it('debe prevenir dependencias circulares (tarea depende de sí misma)', async () => {
      await expect(
        service.update('tarea-1', { dependeDe: 'tarea-1' }, mockAdminUser)
      ).rejects.toThrow(HTTPException);
    });

    it('debe validar dependencia del mismo proyecto', async () => {
      vi.mocked(tareasRepository.findById).mockResolvedValueOnce(mockTarea); // La tarea a actualizar
      vi.mocked(tareasRepository.findById).mockResolvedValueOnce({
        ...mockTarea,
        id: 'tarea-2',
        proyectoId: 'otro-proyecto',
      });

      await expect(
        service.update('tarea-1', { dependeDe: 'tarea-2' }, mockAdminUser)
      ).rejects.toThrow(HTTPException);
    });

    it('debe validar fechas al actualizar', async () => {
      await expect(
        service.update(
          'tarea-1',
          { fechaInicio: '2024-12-31', fechaFin: '2024-01-01' },
          mockAdminUser
        )
      ).rejects.toThrow(HTTPException);
    });
  });

  describe('delete - Permisos', () => {
    beforeEach(() => {
      vi.mocked(tareasRepository.findById).mockResolvedValue(mockTarea);
      vi.mocked(tareasRepository.findDependientes).mockResolvedValue([]);
      vi.mocked(tareasRepository.delete).mockResolvedValue(true);
    });

    it('ADMIN puede eliminar tareas', async () => {
      await service.delete('tarea-1', mockAdminUser);

      expect(tareasRepository.delete).toHaveBeenCalledWith('tarea-1');
    });

    it('EMPLEADO NO puede eliminar tareas', async () => {
      await expect(
        service.delete('tarea-1', mockEmpleadoUser)
      ).rejects.toThrow(HTTPException);
    });
  });

  describe('delete - Validaciones', () => {
    beforeEach(() => {
      vi.mocked(tareasRepository.findById).mockResolvedValue(mockTarea);
      vi.mocked(tareasRepository.delete).mockResolvedValue(true);
    });

    it('debe impedir eliminar tarea con dependientes', async () => {
      vi.mocked(tareasRepository.findDependientes).mockResolvedValue([
        { ...mockTarea, id: 'tarea-2' },
      ]);

      await expect(
        service.delete('tarea-1', mockAdminUser)
      ).rejects.toThrow(HTTPException);
    });

    it('debe permitir eliminar tarea sin dependientes', async () => {
      vi.mocked(tareasRepository.findDependientes).mockResolvedValue([]);

      await service.delete('tarea-1', mockAdminUser);

      expect(tareasRepository.delete).toHaveBeenCalled();
    });
  });

  describe('updateEstado - Permisos', () => {
    beforeEach(() => {
      vi.mocked(tareasRepository.findById).mockResolvedValue(mockTarea);
      vi.mocked(tareasRepository.updateEstado).mockResolvedValue({
        ...mockTarea,
        estado: 'IN_PROGRESS',
      });
    });

    it('ADMIN puede cambiar estado de cualquier tarea', async () => {
      const result = await service.updateEstado('tarea-1', 'IN_PROGRESS', mockAdminUser);

      expect(result.estado).toBe('IN_PROGRESS');
    });

    it('EMPLEADO puede cambiar estado de su tarea asignada', async () => {
      const result = await service.updateEstado('tarea-1', 'IN_PROGRESS', mockEmpleadoUser);

      expect(result.estado).toBe('IN_PROGRESS');
    });

    it('EMPLEADO NO puede cambiar estado de tarea de otro', async () => {
      vi.mocked(tareasRepository.findById).mockResolvedValue({
        ...mockTarea,
        usuarioAsignadoId: 'otro-usuario',
      });

      await expect(
        service.updateEstado('tarea-1', 'IN_PROGRESS', mockEmpleadoUser)
      ).rejects.toThrow(HTTPException);
    });
  });

  describe('updateEstado - Transiciones Válidas', () => {
    beforeEach(() => {
      vi.mocked(tareasRepository.updateEstado).mockImplementation(async (id, estado) => ({
        ...mockTarea,
        estado,
      }));
    });

    it('TODO -> IN_PROGRESS es válida', async () => {
      vi.mocked(tareasRepository.findById).mockResolvedValue({
        ...mockTarea,
        estado: 'TODO',
      });

      const result = await service.updateEstado('tarea-1', 'IN_PROGRESS', mockAdminUser);

      expect(result.estado).toBe('IN_PROGRESS');
    });

    it('IN_PROGRESS -> REVIEW es válida', async () => {
      vi.mocked(tareasRepository.findById).mockResolvedValue({
        ...mockTarea,
        estado: 'IN_PROGRESS',
      });

      const result = await service.updateEstado('tarea-1', 'REVIEW', mockAdminUser);

      expect(result.estado).toBe('REVIEW');
    });

    it('REVIEW -> DONE es válida', async () => {
      vi.mocked(tareasRepository.findById).mockResolvedValue({
        ...mockTarea,
        estado: 'REVIEW',
      });

      const result = await service.updateEstado('tarea-1', 'DONE', mockAdminUser);

      expect(result.estado).toBe('DONE');
    });

    it('DONE -> IN_PROGRESS es válida (reabrir)', async () => {
      vi.mocked(tareasRepository.findById).mockResolvedValue({
        ...mockTarea,
        estado: 'DONE',
      });

      const result = await service.updateEstado('tarea-1', 'IN_PROGRESS', mockAdminUser);

      expect(result.estado).toBe('IN_PROGRESS');
    });

    it('TODO -> DONE NO es válida (saltarse estados)', async () => {
      vi.mocked(tareasRepository.findById).mockResolvedValue({
        ...mockTarea,
        estado: 'TODO',
      });

      await expect(
        service.updateEstado('tarea-1', 'DONE', mockAdminUser)
      ).rejects.toThrow(HTTPException);
    });

    it('BLOCKED puede volver a TODO o IN_PROGRESS', async () => {
      vi.mocked(tareasRepository.findById).mockResolvedValue({
        ...mockTarea,
        estado: 'BLOCKED',
      });

      const resultTodo = await service.updateEstado('tarea-1', 'TODO', mockAdminUser);
      expect(resultTodo.estado).toBe('TODO');

      vi.mocked(tareasRepository.findById).mockResolvedValue({
        ...mockTarea,
        estado: 'BLOCKED',
      });

      const resultProgress = await service.updateEstado('tarea-1', 'IN_PROGRESS', mockAdminUser);
      expect(resultProgress.estado).toBe('IN_PROGRESS');
    });
  });

  describe('reasignar', () => {
    beforeEach(() => {
      vi.mocked(tareasRepository.findById).mockResolvedValue(mockTarea);
      vi.mocked(findActiveUserById).mockResolvedValue(mockEmpleadoUser);
      vi.mocked(tareasRepository.reasignar).mockResolvedValue({
        ...mockTarea,
        usuarioAsignadoId: 'nuevo-usuario',
      });
    });

    it('ADMIN puede reasignar tareas', async () => {
      const result = await service.reasignar('tarea-1', 'nuevo-usuario', mockAdminUser);

      expect(result.usuarioAsignadoId).toBe('nuevo-usuario');
      expect(tareasRepository.reasignar).toHaveBeenCalledWith('tarea-1', 'nuevo-usuario');
    });

    it('MANAGER puede reasignar tareas', async () => {
      const result = await service.reasignar('tarea-1', 'nuevo-usuario', mockManagerUser);

      expect(result.usuarioAsignadoId).toBe('nuevo-usuario');
    });

    it('EMPLEADO NO puede reasignar tareas', async () => {
      await expect(
        service.reasignar('tarea-1', 'nuevo-usuario', mockEmpleadoUser)
      ).rejects.toThrow(HTTPException);
    });

    it('debe validar que el nuevo usuario existe', async () => {
      vi.mocked(findActiveUserById).mockResolvedValue(undefined);

      await expect(
        service.reasignar('tarea-1', 'inexistente', mockAdminUser)
      ).rejects.toThrow(HTTPException);
    });

    it('debe permitir desasignar (null)', async () => {
      vi.mocked(tareasRepository.reasignar).mockResolvedValue({
        ...mockTarea,
        usuarioAsignadoId: null,
      });

      const result = await service.reasignar('tarea-1', null, mockAdminUser);

      expect(result.usuarioAsignadoId).toBeNull();
    });
  });
});
