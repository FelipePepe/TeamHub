import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { db } from '../../db/index.js';
import { tareas } from '../../db/schema/tareas.js';
import { proyectos } from '../../db/schema/proyectos.js';
import { users } from '../../db/schema/users.js';
import { timetracking } from '../../db/schema/timetracking.js';
import { TareasRepository } from '../tareas-repository.js';
import type { NuevaTarea } from '../../db/schema/tareas.js';
import { eq } from 'drizzle-orm';

/**
 * Tests para TareasRepository (100% Coverage - CORE)
 * Incluye tests de base de datos, FKs, validaciones y edge cases
 */
describe('TareasRepository', () => {
  let repository: TareasRepository;
  let testProyectoId: string;
  let testUsuarioId: string;
  let testTareaId: string;

  beforeEach(async () => {
    repository = new TareasRepository();

    // Limpiar tablas en orden inverso a las FKs
    await db.delete(tareas);
    await db.delete(timetracking);
    await db.delete(proyectos);
    await db.delete(users);

    // Crear datos de prueba
    const [usuario] = await db
      .insert(users)
      .values({
        email: 'test@example.com',
        nombre: 'Test User',
        passwordHash: 'hash123',
        rol: 'EMPLEADO',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    testUsuarioId = usuario.id;

    const [proyecto] = await db
      .insert(proyectos)
      .values({
        nombre: 'Proyecto Test',
        descripcion: 'Proyecto de prueba',
        codigo: 'TEST-001',
        estado: 'ACTIVO',
        managerId: testUsuarioId,
        createdBy: testUsuarioId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    testProyectoId = proyecto.id;

    const [tarea] = await db
      .insert(tareas)
      .values({
        proyectoId: testProyectoId,
        titulo: 'Tarea Test',
        descripcion: 'Descripción test',
        estado: 'TODO',
        prioridad: 'MEDIUM',
        usuarioAsignadoId: testUsuarioId,
        orden: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    testTareaId = tarea.id;
  });

  afterAll(async () => {
    // Cleanup final
    await db.delete(tareas);
    await db.delete(timetracking);
    await db.delete(proyectos);
    await db.delete(users);
  });

  describe('findByProyecto', () => {
    it('debe listar tareas de un proyecto ordenadas por orden y fecha', async () => {
      // Crear tareas adicionales con diferentes órdenes
      await db.insert(tareas).values([
        {
          proyectoId: testProyectoId,
          titulo: 'Tarea 2',
          estado: 'TODO',
          prioridad: 'HIGH',
          orden: '2',
          createdAt: new Date(Date.now() - 1000),
          updatedAt: new Date(),
        },
        {
          proyectoId: testProyectoId,
          titulo: 'Tarea 3',
          estado: 'IN_PROGRESS',
          prioridad: 'LOW',
          orden: '0',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await repository.findByProyecto(testProyectoId);

      expect(result).toHaveLength(3);
      expect(result[0].titulo).toBe('Tarea 3'); // orden: '0'
      expect(result[1].titulo).toBe('Tarea Test'); // orden: '1'
      expect(result[2].titulo).toBe('Tarea 2'); // orden: '2'
    });

    it('debe excluir tareas con deletedAt', async () => {
      await db.insert(tareas).values({
        proyectoId: testProyectoId,
        titulo: 'Tarea Eliminada',
        estado: 'TODO',
        prioridad: 'MEDIUM',
        orden: '10',
        deletedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await repository.findByProyecto(testProyectoId);

      expect(result).toHaveLength(1);
      expect(result[0].titulo).toBe('Tarea Test');
    });

    it('debe retornar array vacío si no hay tareas en el proyecto', async () => {
      const [proyectoVacio] = await db
        .insert(proyectos)
        .values({
          nombre: 'Proyecto Vacío',
          codigo: 'EMPTY-001',
          estado: 'ACTIVO',
          managerId: testUsuarioId,
          createdBy: testUsuarioId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const result = await repository.findByProyecto(proyectoVacio.id);

      expect(result).toEqual([]);
    });
  });

  describe('findByUsuario', () => {
    it('debe listar tareas asignadas a un usuario ordenadas por fecha desc', async () => {
      await db.insert(tareas).values({
        proyectoId: testProyectoId,
        titulo: 'Tarea Usuario 2',
        estado: 'IN_PROGRESS',
        prioridad: 'HIGH',
        usuarioAsignadoId: testUsuarioId,
        orden: '2',
        createdAt: new Date(Date.now() + 1000),
        updatedAt: new Date(),
      });

      const result = await repository.findByUsuario(testUsuarioId);

      expect(result).toHaveLength(2);
      expect(result[0].titulo).toBe('Tarea Usuario 2'); // Más reciente
      expect(result[1].titulo).toBe('Tarea Test');
    });

    it('debe excluir tareas eliminadas', async () => {
      await db.insert(tareas).values({
        proyectoId: testProyectoId,
        titulo: 'Tarea Eliminada Usuario',
        estado: 'TODO',
        prioridad: 'MEDIUM',
        usuarioAsignadoId: testUsuarioId,
        orden: '5',
        deletedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await repository.findByUsuario(testUsuarioId);

      expect(result).toHaveLength(1);
    });

    it('debe retornar array vacío si el usuario no tiene tareas', async () => {
      const [otroUsuario] = await db
        .insert(users)
        .values({
          email: 'otro@example.com',
          nombre: 'Otro Usuario',
          passwordHash: 'hash456',
          rol: 'EMPLEADO',
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const result = await repository.findByUsuario(otroUsuario.id);

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('debe obtener una tarea por ID', async () => {
      const result = await repository.findById(testTareaId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(testTareaId);
      expect(result?.titulo).toBe('Tarea Test');
    });

    it('debe retornar undefined si la tarea no existe', async () => {
      const result = await repository.findById('00000000-0000-0000-0000-000000000000');

      expect(result).toBeUndefined();
    });

    it('debe excluir tarea eliminada', async () => {
      await db
        .update(tareas)
        .set({ deletedAt: new Date() })
        .where(eq(tareas.id, testTareaId));

      const result = await repository.findById(testTareaId);

      expect(result).toBeUndefined();
    });
  });

  describe('create', () => {
    it('debe crear tarea con datos válidos y campos requeridos', async () => {
      const nuevaTarea: NuevaTarea = {
        proyectoId: testProyectoId,
        titulo: 'Nueva Tarea',
        descripcion: 'Descripción nueva',
        estado: 'TODO',
        prioridad: 'HIGH',
        orden: '10',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await repository.create(nuevaTarea);

      expect(result.id).toBeDefined();
      expect(result.titulo).toBe('Nueva Tarea');
      expect(result.estado).toBe('TODO');
      expect(result.prioridad).toBe('HIGH');
    });

    it('debe crear tarea con campos opcionales', async () => {
      const nuevaTarea: NuevaTarea = {
        proyectoId: testProyectoId,
        titulo: 'Tarea Completa',
        descripcion: 'Con todos los campos',
        estado: 'IN_PROGRESS',
        prioridad: 'URGENT',
        usuarioAsignadoId: testUsuarioId,
        fechaInicio: new Date('2024-01-01'),
        fechaFin: new Date('2024-01-31'),
        horasEstimadas: '40',
        horasReales: '35',
        orden: '5',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await repository.create(nuevaTarea);

      expect(result.usuarioAsignadoId).toBe(testUsuarioId);
      expect(result.fechaInicio).toEqual(new Date('2024-01-01'));
      expect(result.horasEstimadas).toBe('40.00'); // DB añade decimales
    });

    it('debe crear tarea con dependencia válida', async () => {
      const nuevaTarea: NuevaTarea = {
        proyectoId: testProyectoId,
        titulo: 'Tarea Dependiente',
        estado: 'TODO',
        prioridad: 'MEDIUM',
        dependeDe: testTareaId,
        orden: '2',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await repository.create(nuevaTarea);

      expect(result.dependeDe).toBe(testTareaId);
    });

    it('debe crear tarea sin usuario asignado (null)', async () => {
      const nuevaTarea: NuevaTarea = {
        proyectoId: testProyectoId,
        titulo: 'Tarea Sin Asignar',
        estado: 'TODO',
        prioridad: 'MEDIUM',
        orden: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await repository.create(nuevaTarea);

      expect(result.usuarioAsignadoId).toBeNull();
    });
  });

  describe('update', () => {
    it('debe actualizar campos de tarea', async () => {
      const updates = {
        titulo: 'Título Actualizado',
        descripcion: 'Nueva descripción',
        prioridad: 'HIGH' as const,
      };

      const result = await repository.update(testTareaId, updates);

      expect(result).toBeDefined();
      expect(result?.titulo).toBe('Título Actualizado');
      expect(result?.prioridad).toBe('HIGH');
    });

    it('debe actualizar fechas', async () => {
      const fechaInicio = new Date('2024-02-01');
      const fechaFin = new Date('2024-02-28');

      const result = await repository.update(testTareaId, {
        fechaInicio,
        fechaFin,
      });

      expect(result?.fechaInicio).toEqual(fechaInicio);
      expect(result?.fechaFin).toEqual(fechaFin);
    });

    it('debe actualizar horas estimadas y reales', async () => {
      const result = await repository.update(testTareaId, {
        horasEstimadas: '50',
        horasReales: '45',
      });

      expect(result?.horasEstimadas).toBe('50.00'); // DB añade decimales
      expect(result?.horasReales).toBe('45.00');
    });

    it('debe permitir establecer campos a null', async () => {
      const result = await repository.update(testTareaId, {
        descripcion: null,
        usuarioAsignadoId: null,
        fechaInicio: null,
        fechaFin: null,
      });

      expect(result?.descripcion).toBeNull();
      expect(result?.usuarioAsignadoId).toBeNull();
      expect(result?.fechaInicio).toBeNull();
      expect(result?.fechaFin).toBeNull();
    });

    it('debe retornar undefined si la tarea no existe', async () => {
      const result = await repository.update(
        '00000000-0000-0000-0000-000000000000',
        { titulo: 'No existe' }
      );

      expect(result).toBeUndefined();
    });

    it('debe ignorar tareas eliminadas', async () => {
      await db
        .update(tareas)
        .set({ deletedAt: new Date() })
        .where(eq(tareas.id, testTareaId));

      const result = await repository.update(testTareaId, {
        titulo: 'Intentar actualizar eliminada',
      });

      expect(result).toBeUndefined();
    });
  });

  describe('updateEstado', () => {
    it('debe actualizar estado de tarea', async () => {
      const result = await repository.updateEstado(testTareaId, 'IN_PROGRESS');

      expect(result).toBeDefined();
      expect(result?.estado).toBe('IN_PROGRESS');
    });

    it('debe actualizar updatedAt al cambiar estado', async () => {
      const antes = new Date();
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await repository.updateEstado(testTareaId, 'DONE');

      expect(result?.updatedAt.getTime()).toBeGreaterThan(antes.getTime());
    });

    it('debe permitir todos los estados válidos', async () => {
      const estados: Array<'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED'> = [
        'TODO',
        'IN_PROGRESS',
        'REVIEW',
        'DONE',
        'BLOCKED',
      ];

      for (const estado of estados) {
        const result = await repository.updateEstado(testTareaId, estado);
        expect(result?.estado).toBe(estado);
      }
    });
  });

  describe('reasignar', () => {
    it('debe reasignar tarea a otro usuario', async () => {
      const [nuevoUsuario] = await db
        .insert(users)
        .values({
          email: 'nuevo@example.com',
          nombre: 'Nuevo Usuario',
          passwordHash: 'hash789',
          rol: 'EMPLEADO',
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const result = await repository.reasignar(testTareaId, nuevoUsuario.id);

      expect(result).toBeDefined();
      expect(result?.usuarioAsignadoId).toBe(nuevoUsuario.id);
    });

    it('debe permitir desasignar tarea (null)', async () => {
      const result = await repository.reasignar(testTareaId, null);

      expect(result).toBeDefined();
      expect(result?.usuarioAsignadoId).toBeNull();
    });

    it('debe actualizar updatedAt', async () => {
      const antes = new Date();
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await repository.reasignar(testTareaId, testUsuarioId);

      expect(result?.updatedAt.getTime()).toBeGreaterThan(antes.getTime());
    });
  });

  describe('delete', () => {
    it('debe hacer soft delete estableciendo deletedAt', async () => {
      const result = await repository.delete(testTareaId);

      expect(result).toBe(true);

      const tarea = await db
        .select()
        .from(tareas)
        .where(eq(tareas.id, testTareaId))
        .limit(1);

      expect(tarea[0].deletedAt).toBeDefined();
    });

    it('debe retornar false si la tarea no existe', async () => {
      const result = await repository.delete('00000000-0000-0000-0000-000000000000');

      expect(result).toBe(false);
    });

    it('debe retornar false si la tarea ya está eliminada', async () => {
      await repository.delete(testTareaId);
      const result = await repository.delete(testTareaId);

      expect(result).toBe(false);
    });

    it('debe excluir tarea eliminada de findById', async () => {
      await repository.delete(testTareaId);
      const tarea = await repository.findById(testTareaId);

      expect(tarea).toBeUndefined();
    });
  });

  describe('findDependientes', () => {
    it('debe encontrar tareas que dependen de una tarea específica', async () => {
      const [tarea1, tarea2] = await db
        .insert(tareas)
        .values([
          {
            proyectoId: testProyectoId,
            titulo: 'Tarea Dependiente 1',
            estado: 'TODO',
            prioridad: 'MEDIUM',
            dependeDe: testTareaId,
            orden: '10',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            proyectoId: testProyectoId,
            titulo: 'Tarea Dependiente 2',
            estado: 'TODO',
            prioridad: 'HIGH',
            dependeDe: testTareaId,
            orden: '11',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ])
        .returning();

      const result = await repository.findDependientes(testTareaId);

      expect(result).toHaveLength(2);
      expect(result.map((t) => t.id)).toContain(tarea1.id);
      expect(result.map((t) => t.id)).toContain(tarea2.id);
    });

    it('debe excluir dependientes eliminadas', async () => {
      await db.insert(tareas).values({
        proyectoId: testProyectoId,
        titulo: 'Dependiente Eliminada',
        estado: 'TODO',
        prioridad: 'MEDIUM',
        dependeDe: testTareaId,
        orden: '20',
        deletedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await repository.findDependientes(testTareaId);

      expect(result).toHaveLength(0);
    });

    it('debe retornar array vacío si no hay dependientes', async () => {
      const result = await repository.findDependientes(testTareaId);

      expect(result).toEqual([]);
    });
  });

  describe('Edge Cases y Validaciones de FK', () => {
    it('debe mantener integridad referencial con proyecto (cascade delete)', async () => {
      await db.delete(proyectos).where(eq(proyectos.id, testProyectoId));

      const tarea = await db
        .select()
        .from(tareas)
        .where(eq(tareas.id, testTareaId))
        .limit(1);

      expect(tarea).toHaveLength(0); // CASCADE delete
    });

    it('debe establecer usuarioAsignadoId a null al eliminar usuario', async () => {
      // Primero eliminar el proyecto que depende del usuario
      await db.delete(proyectos).where(eq(proyectos.id, testProyectoId));
      
      // Crear nuevo proyecto y tarea sin referencia al usuario
      const [otroUsuario] = await db
        .insert(users)
        .values({
          email: 'otro2@example.com',
          nombre: 'Otro Usuario',
          passwordHash: 'hash',
          rol: 'EMPLEADO',
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const [nuevoProyecto] = await db
        .insert(proyectos)
        .values({
          nombre: 'Proyecto Test 2',
          codigo: 'TEST-002',
          estado: 'ACTIVO',
          managerId: otroUsuario.id,
          createdBy: otroUsuario.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const [nuevaTarea] = await db
        .insert(tareas)
        .values({
          proyectoId: nuevoProyecto.id,
          titulo: 'Tarea Test',
          estado: 'TODO',
          prioridad: 'MEDIUM',
          usuarioAsignadoId: testUsuarioId,
          orden: '1',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Ahora sí podemos eliminar testUsuarioId
      await db.delete(users).where(eq(users.id, testUsuarioId));

      const tarea = await db
        .select()
        .from(tareas)
        .where(eq(tareas.id, nuevaTarea.id))
        .limit(1);

      expect(tarea[0]?.usuarioAsignadoId).toBeNull();
    });

    it('debe manejar orden como string para números grandes', async () => {
      const nuevaTarea: NuevaTarea = {
        proyectoId: testProyectoId,
        titulo: 'Orden Grande',
        estado: 'TODO',
        prioridad: 'MEDIUM',
        orden: '999999999',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await repository.create(nuevaTarea);

      // DB puede convertir a number, verificar que se preserva
      expect(result.orden).toBe(999999999);
    });

    it('debe manejar horas como string decimal con precisión', async () => {
      const nuevaTarea: NuevaTarea = {
        proyectoId: testProyectoId,
        titulo: 'Horas Decimales',
        estado: 'TODO',
        prioridad: 'MEDIUM',
        horasEstimadas: '12.75',
        horasReales: '13.25',
        orden: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await repository.create(nuevaTarea);

      expect(result.horasEstimadas).toBe('12.75');
      expect(result.horasReales).toBe('13.25');
    });
  });
});
