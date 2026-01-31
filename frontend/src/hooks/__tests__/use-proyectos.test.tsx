import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  useProyectos,
  useMisProyectos,
  useProyecto,
  useProyectoStats,
  useAsignaciones,
  useCreateProyecto,
  useUpdateProyecto,
  useDeleteProyecto,
  useUpdateProyectoEstado,
  useCreateAsignacion,
  useUpdateAsignacion,
  useDeleteAsignacion,
  useFinalizarAsignacion,
  type Proyecto,
  type Asignacion,
  type ProyectoListResponse,
  type ProyectoStatsResponse,
  type AsignacionListResponse,
} from '../use-proyectos';

// Mock de la API
const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  get: apiMocks.get,
  post: apiMocks.post,
  put: apiMocks.put,
  patch: apiMocks.patch,
  del: apiMocks.del,
}));

// Helper para crear QueryClient de test
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  function QueryClientWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return QueryClientWrapper;
}

/**
 * Tests para use-proyectos hook
 * Cobertura objetivo: 80%+
 */
describe('use-proyectos', () => {
  const mockProyecto: Proyecto = {
    id: 'proyecto-1',
    nombre: 'Proyecto Alpha',
    codigo: 'ALPHA',
    descripcion: 'Descripción del proyecto',
    cliente: 'Cliente Test',
    estado: 'ACTIVO',
    managerId: 'manager-1',
    activo: true,
    fechaInicio: '2024-01-01',
    fechaFinEstimada: '2024-12-31',
  };

  const mockProyectosResponse: ProyectoListResponse = {
    data: [mockProyecto],
  };

  const mockAsignacion: Asignacion = {
    id: 'asignacion-1',
    proyectoId: 'proyecto-1',
    usuarioId: 'usuario-1',
    rol: 'Developer',
    dedicacionPorcentaje: 100,
    fechaInicio: '2024-01-01',
    activo: true,
  };

  const mockAsignacionesResponse: AsignacionListResponse = {
    data: [mockAsignacion],
  };

  const mockStats: ProyectoStatsResponse = {
    presupuestoHoras: 1000,
    horasConsumidas: 500,
    asignacionesActivas: 5,
    progreso: 50,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // useProyectos Tests
  // ============================================================================
  describe('useProyectos', () => {
    it('debe obtener lista de proyectos', async () => {
      apiMocks.get.mockResolvedValue(mockProyectosResponse);

      const { result } = renderHook(() => useProyectos(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/proyectos', {});
      expect(result.current.data).toEqual(mockProyectosResponse);
    });

    it('debe pasar filtros a la API', async () => {
      apiMocks.get.mockResolvedValue(mockProyectosResponse);

      const filters = {
        estado: 'ACTIVO' as const,
        managerId: 'manager-1',
        cliente: 'Cliente Test',
      };

      const { result } = renderHook(() => useProyectos(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/proyectos', {
        estado: 'ACTIVO',
        managerId: 'manager-1',
        cliente: 'Cliente Test',
      });
    });

    it('debe retornar loading mientras carga', () => {
      apiMocks.get.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useProyectos(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('debe manejar errores', async () => {
      const error = { message: 'Error de red' };
      apiMocks.get.mockRejectedValue(error);

      const { result } = renderHook(() => useProyectos(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  // ============================================================================
  // useMisProyectos Tests
  // ============================================================================
  describe('useMisProyectos', () => {
    it('debe obtener mis proyectos', async () => {
      apiMocks.get.mockResolvedValue(mockProyectosResponse);

      const { result } = renderHook(() => useMisProyectos(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/proyectos/mis-proyectos');
    });
  });

  // ============================================================================
  // useProyecto Tests
  // ============================================================================
  describe('useProyecto', () => {
    it('debe obtener un proyecto por ID', async () => {
      apiMocks.get.mockResolvedValue(mockProyecto);

      const { result } = renderHook(() => useProyecto('proyecto-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/proyectos/proyecto-1');
      expect(result.current.data).toEqual(mockProyecto);
    });

    it('no debe ejecutar query si ID está vacío', () => {
      const { result } = renderHook(() => useProyecto(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(apiMocks.get).not.toHaveBeenCalled();
    });

    it('no debe ejecutar query si enabled es false', () => {
      const { result } = renderHook(() => useProyecto('proyecto-1', false), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(apiMocks.get).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // useProyectoStats Tests
  // ============================================================================
  describe('useProyectoStats', () => {
    it('debe obtener estadísticas del proyecto', async () => {
      apiMocks.get.mockResolvedValue(mockStats);

      const { result } = renderHook(() => useProyectoStats('proyecto-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/proyectos/proyecto-1/estadisticas');
      expect(result.current.data).toEqual(mockStats);
    });

    it('no debe ejecutar si ID está vacío', () => {
      const { result } = renderHook(() => useProyectoStats(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
    });
  });

  // ============================================================================
  // useAsignaciones Tests
  // ============================================================================
  describe('useAsignaciones', () => {
    it('debe obtener asignaciones del proyecto', async () => {
      apiMocks.get.mockResolvedValue(mockAsignacionesResponse);

      const { result } = renderHook(() => useAsignaciones('proyecto-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/proyectos/proyecto-1/asignaciones');
      expect(result.current.data).toEqual(mockAsignacionesResponse);
    });

    it('no debe ejecutar si proyectoId está vacío', () => {
      const { result } = renderHook(() => useAsignaciones(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
    });
  });

  // ============================================================================
  // useCreateProyecto Tests
  // ============================================================================
  describe('useCreateProyecto', () => {
    it('debe crear un proyecto', async () => {
      apiMocks.post.mockResolvedValue(mockProyecto);

      const { result } = renderHook(() => useCreateProyecto(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        nombre: 'Nuevo Proyecto',
        codigo: 'NEW',
      });

      expect(apiMocks.post).toHaveBeenCalledWith('/proyectos', {
        nombre: 'Nuevo Proyecto',
        codigo: 'NEW',
      });
    });

    it('debe manejar errores de creación', async () => {
      const error = { message: 'Error al crear' };
      apiMocks.post.mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useCreateProyecto(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({
          nombre: 'Proyecto',
          codigo: 'PRJ',
        })
      ).rejects.toEqual(error);

      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // useUpdateProyecto Tests
  // ============================================================================
  describe('useUpdateProyecto', () => {
    it('debe actualizar un proyecto', async () => {
      apiMocks.put.mockResolvedValue({ ...mockProyecto, nombre: 'Actualizado' });

      const { result } = renderHook(() => useUpdateProyecto(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        id: 'proyecto-1',
        data: { nombre: 'Actualizado' },
      });

      expect(apiMocks.put).toHaveBeenCalledWith('/proyectos/proyecto-1', {
        nombre: 'Actualizado',
      });
    });
  });

  // ============================================================================
  // useDeleteProyecto Tests
  // ============================================================================
  describe('useDeleteProyecto', () => {
    it('debe eliminar un proyecto', async () => {
      apiMocks.del.mockResolvedValue({ message: 'Eliminado' });

      const { result } = renderHook(() => useDeleteProyecto(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync('proyecto-1');

      expect(apiMocks.del).toHaveBeenCalledWith('/proyectos/proyecto-1');
    });
  });

  // ============================================================================
  // useUpdateProyectoEstado Tests
  // ============================================================================
  describe('useUpdateProyectoEstado', () => {
    it('debe actualizar el estado de un proyecto', async () => {
      apiMocks.patch.mockResolvedValue({ ...mockProyecto, estado: 'COMPLETADO' });

      const { result } = renderHook(() => useUpdateProyectoEstado(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        id: 'proyecto-1',
        estado: 'COMPLETADO',
      });

      expect(apiMocks.patch).toHaveBeenCalledWith('/proyectos/proyecto-1/estado', {
        estado: 'COMPLETADO',
      });
    });
  });

  // ============================================================================
  // useCreateAsignacion Tests
  // ============================================================================
  describe('useCreateAsignacion', () => {
    it('debe crear una asignación', async () => {
      apiMocks.post.mockResolvedValue(mockAsignacion);

      const { result } = renderHook(() => useCreateAsignacion('proyecto-1'), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        usuarioId: 'usuario-1',
        fechaInicio: '2024-01-01',
        dedicacionPorcentaje: 100,
      });

      expect(apiMocks.post).toHaveBeenCalledWith('/proyectos/proyecto-1/asignaciones', {
        usuarioId: 'usuario-1',
        fechaInicio: '2024-01-01',
        dedicacionPorcentaje: 100,
      });
    });
  });

  // ============================================================================
  // useUpdateAsignacion Tests
  // ============================================================================
  describe('useUpdateAsignacion', () => {
    it('debe actualizar una asignación', async () => {
      apiMocks.put.mockResolvedValue({ ...mockAsignacion, dedicacionPorcentaje: 50 });

      const { result } = renderHook(() => useUpdateAsignacion('proyecto-1'), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        asigId: 'asignacion-1',
        data: { dedicacionPorcentaje: 50 },
      });

      expect(apiMocks.put).toHaveBeenCalledWith(
        '/proyectos/proyecto-1/asignaciones/asignacion-1',
        { dedicacionPorcentaje: 50 }
      );
    });
  });

  // ============================================================================
  // useDeleteAsignacion Tests
  // ============================================================================
  describe('useDeleteAsignacion', () => {
    it('debe eliminar una asignación', async () => {
      apiMocks.del.mockResolvedValue({ message: 'Eliminada' });

      const { result } = renderHook(() => useDeleteAsignacion('proyecto-1'), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ asigId: 'asignacion-1' });

      expect(apiMocks.del).toHaveBeenCalledWith(
        '/proyectos/proyecto-1/asignaciones/asignacion-1'
      );
    });
  });

  // ============================================================================
  // useFinalizarAsignacion Tests
  // ============================================================================
  describe('useFinalizarAsignacion', () => {
    it('debe finalizar una asignación', async () => {
      apiMocks.patch.mockResolvedValue({ ...mockAsignacion, activo: false });

      const { result } = renderHook(() => useFinalizarAsignacion('proyecto-1'), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ asigId: 'asignacion-1' });

      expect(apiMocks.patch).toHaveBeenCalledWith(
        '/proyectos/proyecto-1/asignaciones/asignacion-1/finalizar',
        {}
      );
    });
  });
});
