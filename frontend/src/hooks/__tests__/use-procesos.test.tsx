import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  useProcesos,
  useProceso,
  useProcesosByEmpleado,
  useEstadisticasProcesos,
  useMisTareas,
  useCreateProceso,
  useUpdateProceso,
  useCancelarProceso,
  usePausarProceso,
  useReanudarProceso,
  useTareasProceso,
  useUpdateTareaProceso,
  useCompletarTarea,
  type Proceso,
  type TareaOnboarding,
  type ProcesoFilters,
  type ProcesoListResponse,
  type TareasOnboardingListResponse,
  type ProcesoEstadisticas,
} from '../use-procesos';

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

describe('useProcesos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProceso: Proceso = {
    id: 'proceso-1',
    empleadoId: 'emp-1',
    empleadoNombre: 'Juan Pérez',
    plantillaId: 'plantilla-1',
    plantillaNombre: 'Onboarding Desarrollador',
    fechaInicio: '2024-01-01',
    estado: 'EN_CURSO',
    progreso: '0.4',
    iniciadoPor: 'admin-1',
    creadoEn: '2024-01-01T00:00:00Z',
    actualizadoEn: '2024-01-01T00:00:00Z',
  };

  const mockProcesosResponse: ProcesoListResponse = {
    data: [mockProceso],
  };

  const mockTarea: TareaOnboarding = {
    id: 'tarea-1',
    procesoId: 'proceso-1',
    titulo: 'Configurar equipo',
    categoria: 'EQUIPAMIENTO',
    responsableId: 'emp-1',
    estado: 'PENDIENTE',
    prioridad: 'MEDIA',
    orden: 1,
    creadoEn: '2024-01-01T00:00:00Z',
    actualizadoEn: '2024-01-01T00:00:00Z',
  };

  const mockTareasResponse: TareasOnboardingListResponse = {
    data: [mockTarea],
  };

  const mockEstadisticas: ProcesoEstadisticas = {
    total: 10,
    enCurso: 5,
    completados: 3,
    cancelados: 1,
    pausados: 1,
  };

  describe('useProcesos', () => {
    it('debe obtener lista de procesos sin filtros', async () => {
      apiMocks.get.mockResolvedValue(mockProcesosResponse);

      const { result } = renderHook(() => useProcesos(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/procesos', {});
      expect(result.current.data).toEqual(mockProcesosResponse);
    });

    it('debe aplicar filtros correctamente', async () => {
      apiMocks.get.mockResolvedValue(mockProcesosResponse);

      const filters: ProcesoFilters = {
        estado: 'EN_CURSO',
        empleadoId: 'emp-1',
        departamentoId: 'dept-1',
      };

      const { result } = renderHook(() => useProcesos(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/procesos', {
        estado: 'EN_CURSO',
        empleadoId: 'emp-1',
        departamentoId: 'dept-1',
      });
    });
  });

  describe('useProceso', () => {
    it('debe obtener un proceso por ID', async () => {
      apiMocks.get.mockResolvedValue(mockProceso);

      const { result } = renderHook(() => useProceso('proceso-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/procesos/proceso-1');
      expect(result.current.data).toEqual(mockProceso);
    });

    it('no debe ejecutar la query si el ID está vacío', () => {
      const { result } = renderHook(() => useProceso(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(apiMocks.get).not.toHaveBeenCalled();
    });

    it('no debe ejecutar la query si enabled es false', () => {
      const { result } = renderHook(() => useProceso('proceso-1', false), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(apiMocks.get).not.toHaveBeenCalled();
    });
  });

  describe('useProcesosByEmpleado', () => {
    it('debe obtener procesos por empleado', async () => {
      apiMocks.get.mockResolvedValue(mockProcesosResponse);

      const { result } = renderHook(
        () => useProcesosByEmpleado('emp-1'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/procesos/empleado/emp-1');
      expect(result.current.data).toEqual(mockProcesosResponse);
    });
  });

  describe('useEstadisticasProcesos', () => {
    it('debe obtener estadísticas de procesos', async () => {
      apiMocks.get.mockResolvedValue(mockEstadisticas);

      const { result } = renderHook(() => useEstadisticasProcesos(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/procesos/estadisticas');
      expect(result.current.data).toEqual(mockEstadisticas);
    });
  });

  describe('useMisTareas', () => {
    it('debe obtener mis tareas pendientes', async () => {
      apiMocks.get.mockResolvedValue(mockTareasResponse);

      const { result } = renderHook(() => useMisTareas(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/procesos/mis-tareas');
      expect(result.current.data).toEqual(mockTareasResponse);
    });
  });

  describe('useCreateProceso', () => {
    it('debe crear un proceso y invalidar queries', async () => {
      apiMocks.post.mockResolvedValue(mockProceso);

      const { result } = renderHook(() => useCreateProceso(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        empleadoId: 'emp-1',
        plantillaId: 'plantilla-1',
        fechaInicio: '2024-01-01',
      });

      expect(apiMocks.post).toHaveBeenCalledWith('/procesos', {
        empleadoId: 'emp-1',
        plantillaId: 'plantilla-1',
        fechaInicio: '2024-01-01',
      });
    });
  });

  describe('useUpdateProceso', () => {
    it('debe actualizar un proceso', async () => {
      const updatedProceso = { ...mockProceso, notas: 'Notas actualizadas' };
      apiMocks.put.mockResolvedValue(updatedProceso);

      const { result } = renderHook(() => useUpdateProceso(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        id: 'proceso-1',
        data: { notas: 'Notas actualizadas' },
      });

      expect(apiMocks.put).toHaveBeenCalledWith('/procesos/proceso-1', {
        notas: 'Notas actualizadas',
      });
    });
  });

  describe('useCancelarProceso', () => {
    it('debe cancelar un proceso', async () => {
      const canceledProceso = { ...mockProceso, estado: 'CANCELADO' as const };
      apiMocks.patch.mockResolvedValue(canceledProceso);

      const { result } = renderHook(() => useCancelarProceso(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        id: 'proceso-1',
        data: { motivo: 'Ya no es necesario' },
      });

      expect(apiMocks.patch).toHaveBeenCalledWith(
        '/procesos/proceso-1/cancelar',
        { motivo: 'Ya no es necesario' }
      );
    });

    it('debe cancelar sin motivo', async () => {
      const canceledProceso = { ...mockProceso, estado: 'CANCELADO' as const };
      apiMocks.patch.mockResolvedValue(canceledProceso);

      const { result } = renderHook(() => useCancelarProceso(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        id: 'proceso-1',
        data: {},
      });

      expect(apiMocks.patch).toHaveBeenCalledWith(
        '/procesos/proceso-1/cancelar',
        {}
      );
    });
  });

  describe('usePausarProceso', () => {
    it('debe pausar un proceso', async () => {
      const pausedProceso = { ...mockProceso, estado: 'PAUSADO' as const };
      apiMocks.patch.mockResolvedValue(pausedProceso);

      const { result } = renderHook(() => usePausarProceso(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync('proceso-1');

      expect(apiMocks.patch).toHaveBeenCalledWith(
        '/procesos/proceso-1/pausar',
        {}
      );
    });
  });

  describe('useReanudarProceso', () => {
    it('debe reanudar un proceso pausado', async () => {
      const resumedProceso = { ...mockProceso, estado: 'EN_CURSO' as const };
      apiMocks.patch.mockResolvedValue(resumedProceso);

      const { result } = renderHook(() => useReanudarProceso(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync('proceso-1');

      expect(apiMocks.patch).toHaveBeenCalledWith(
        '/procesos/proceso-1/reanudar',
        {}
      );
    });
  });

  describe('useTareasProceso', () => {
    it('debe obtener tareas de un proceso', async () => {
      apiMocks.get.mockResolvedValue(mockTareasResponse);

      const { result } = renderHook(
        () => useTareasProceso('proceso-1'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/procesos/proceso-1/tareas');
      expect(result.current.data).toEqual(mockTareasResponse);
    });

    it('no debe ejecutar la query si el procesoId está vacío', () => {
      const { result } = renderHook(() => useTareasProceso(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(apiMocks.get).not.toHaveBeenCalled();
    });
  });

  describe('useUpdateTareaProceso', () => {
    it('debe actualizar una tarea de proceso', async () => {
      const updatedTarea = { ...mockTarea, prioridad: 'ALTA' as const };
      apiMocks.patch.mockResolvedValue(updatedTarea);

      const { result } = renderHook(() => useUpdateTareaProceso(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        procesoId: 'proceso-1',
        tareaId: 'tarea-1',
        data: { prioridad: 'ALTA' },
      });

      expect(apiMocks.patch).toHaveBeenCalledWith(
        '/procesos/proceso-1/tareas/tarea-1',
        { prioridad: 'ALTA' }
      );
    });
  });

  describe('useCompletarTarea', () => {
    it('debe completar una tarea con datos', async () => {
      const completedTarea = {
        ...mockTarea,
        estado: 'COMPLETADA' as const,
        notas: 'Tarea completada',
      };
      apiMocks.patch.mockResolvedValue(completedTarea);

      const { result } = renderHook(() => useCompletarTarea(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        procesoId: 'proceso-1',
        tareaId: 'tarea-1',
        data: { notas: 'Tarea completada' },
      });

      expect(apiMocks.patch).toHaveBeenCalledWith(
        '/procesos/proceso-1/tareas/tarea-1/completar',
        { notas: 'Tarea completada' }
      );
    });

    it('debe completar una tarea sin datos adicionales', async () => {
      const completedTarea = { ...mockTarea, estado: 'COMPLETADA' as const };
      apiMocks.patch.mockResolvedValue(completedTarea);

      const { result } = renderHook(() => useCompletarTarea(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        procesoId: 'proceso-1',
        tareaId: 'tarea-1',
      });

      expect(apiMocks.patch).toHaveBeenCalledWith(
        '/procesos/proceso-1/tareas/tarea-1/completar',
        {}
      );
    });
  });

  describe('Gestión de estados', () => {
    it('debe manejar transiciones de estado correctamente', async () => {
      // EN_CURSO → PAUSADO
      const pausedProceso = { ...mockProceso, estado: 'PAUSADO' as const };
      apiMocks.patch.mockResolvedValueOnce(pausedProceso);

      const { result: pausarResult } = renderHook(() => usePausarProceso(), {
        wrapper: createWrapper(),
      });

      await pausarResult.current.mutateAsync('proceso-1');
      expect(apiMocks.patch).toHaveBeenCalledWith('/procesos/proceso-1/pausar', {});

      // PAUSADO → EN_CURSO
      const resumedProceso = { ...mockProceso, estado: 'EN_CURSO' as const };
      apiMocks.patch.mockResolvedValueOnce(resumedProceso);

      const { result: reanudarResult } = renderHook(() => useReanudarProceso(), {
        wrapper: createWrapper(),
      });

      await reanudarResult.current.mutateAsync('proceso-1');
      expect(apiMocks.patch).toHaveBeenCalledWith('/procesos/proceso-1/reanudar', {});

      // EN_CURSO → CANCELADO
      const canceledProceso = { ...mockProceso, estado: 'CANCELADO' as const };
      apiMocks.patch.mockResolvedValueOnce(canceledProceso);

      const { result: cancelarResult } = renderHook(() => useCancelarProceso(), {
        wrapper: createWrapper(),
      });

      await cancelarResult.current.mutateAsync({ id: 'proceso-1', data: {} });
      expect(apiMocks.patch).toHaveBeenCalledWith('/procesos/proceso-1/cancelar', {});
    });
  });
});
