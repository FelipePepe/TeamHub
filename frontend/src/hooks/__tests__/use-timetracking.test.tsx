import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  useTimeEntries,
  useMisRegistros,
  useTimeEntriesSemana,
  useTimeEntry,
  usePendientesAprobacion,
  useResumenTimetracking,
  useCreateTimeEntry,
  useUpdateTimeEntry,
  useDeleteTimeEntry,
  useAprobarTimeEntry,
  useRechazarTimeEntry,
  useAprobarMasivo,
  useCopiarRegistros,
  type TimeEntry,
  type TimetrackingListResponse,
  type PendientesAprobacionResponse,
  type TimetrackingResumenResponse,
} from '../use-timetracking';

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
 * Tests para use-timetracking hook
 * Cobertura objetivo: 80%+
 */
describe('use-timetracking', () => {
  const mockTimeEntry: TimeEntry = {
    id: 'entry-1',
    usuarioId: 'usuario-1',
    proyectoId: 'proyecto-1',
    fecha: '2024-06-15',
    horas: 8,
    descripcion: 'Desarrollo de feature',
    facturable: true,
    estado: 'PENDIENTE',
    createdAt: '2024-06-15T08:00:00Z',
  };

  const mockTimeEntriesResponse: TimetrackingListResponse = {
    data: [mockTimeEntry],
  };

  const mockPendientesResponse: PendientesAprobacionResponse = {
    data: [
      {
        usuarioId: 'usuario-1',
        usuarioNombre: 'Usuario Test',
        proyectoId: 'proyecto-1',
        proyectoNombre: 'Proyecto Test',
        totalHoras: 40,
        registros: [mockTimeEntry],
      },
    ],
  };

  const mockResumenResponse: TimetrackingResumenResponse = {
    totalHoras: 160,
    horasFacturables: 120,
    horasNoFacturables: 40,
    porProyecto: [{ proyectoId: 'proyecto-1', nombre: 'Proyecto Test', horas: 160 }],
    porDia: [{ fecha: '2024-06-15', horas: 8 }],
    porEstado: [{ estado: 'APROBADO', horas: 100 }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // useTimeEntries Tests
  // ============================================================================
  describe('useTimeEntries', () => {
    it('debe obtener lista de registros', async () => {
      apiMocks.get.mockResolvedValue(mockTimeEntriesResponse);

      const { result } = renderHook(() => useTimeEntries(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/timetracking', {});
      expect(result.current.data).toEqual(mockTimeEntriesResponse);
    });

    it('debe pasar filtros a la API', async () => {
      apiMocks.get.mockResolvedValue(mockTimeEntriesResponse);

      const filters = {
        usuarioId: 'usuario-1',
        proyectoId: 'proyecto-1',
        estado: 'PENDIENTE' as const,
        fechaInicio: '2024-01-01',
        fechaFin: '2024-12-31',
        facturable: true,
        page: 1,
        limit: 20,
      };

      const { result } = renderHook(() => useTimeEntries(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/timetracking', {
        usuarioId: 'usuario-1',
        proyectoId: 'proyecto-1',
        estado: 'PENDIENTE',
        fechaInicio: '2024-01-01',
        fechaFin: '2024-12-31',
        facturable: 'true',
        page: '1',
        limit: '20',
      });
    });

    it('debe manejar errores', async () => {
      const error = { message: 'Error de red' };
      apiMocks.get.mockRejectedValue(error);

      const { result } = renderHook(() => useTimeEntries(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(error);
    });
  });

  // ============================================================================
  // useMisRegistros Tests
  // ============================================================================
  describe('useMisRegistros', () => {
    it('debe obtener mis registros', async () => {
      apiMocks.get.mockResolvedValue(mockTimeEntriesResponse);

      const { result } = renderHook(() => useMisRegistros(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/timetracking/mis-registros');
    });
  });

  // ============================================================================
  // useTimeEntriesSemana Tests
  // ============================================================================
  describe('useTimeEntriesSemana', () => {
    it('debe obtener registros de la semana', async () => {
      apiMocks.get.mockResolvedValue(mockTimeEntriesResponse);

      const { result } = renderHook(() => useTimeEntriesSemana('2024-06-15'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/timetracking/semana/2024-06-15');
    });

    it('no debe ejecutar si fecha está vacía', () => {
      const { result } = renderHook(() => useTimeEntriesSemana(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(apiMocks.get).not.toHaveBeenCalled();
    });

    it('no debe ejecutar si enabled es false', () => {
      const { result } = renderHook(() => useTimeEntriesSemana('2024-06-15', false), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
    });
  });

  // ============================================================================
  // useTimeEntry Tests
  // ============================================================================
  describe('useTimeEntry', () => {
    it('debe obtener un registro por ID', async () => {
      apiMocks.get.mockResolvedValue(mockTimeEntry);

      const { result } = renderHook(() => useTimeEntry('entry-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/timetracking/entry-1');
      expect(result.current.data).toEqual(mockTimeEntry);
    });

    it('no debe ejecutar si ID está vacío', () => {
      const { result } = renderHook(() => useTimeEntry(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
    });
  });

  // ============================================================================
  // usePendientesAprobacion Tests
  // ============================================================================
  describe('usePendientesAprobacion', () => {
    it('debe obtener pendientes de aprobación', async () => {
      apiMocks.get.mockResolvedValue(mockPendientesResponse);

      const { result } = renderHook(() => usePendientesAprobacion(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/timetracking/pendientes-aprobacion');
      expect(result.current.data).toEqual(mockPendientesResponse);
    });

    it('no debe ejecutar si enabled es false', () => {
      const { result } = renderHook(() => usePendientesAprobacion(false), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
    });
  });

  // ============================================================================
  // useResumenTimetracking Tests
  // ============================================================================
  describe('useResumenTimetracking', () => {
    it('debe obtener resumen de timetracking', async () => {
      apiMocks.get.mockResolvedValue(mockResumenResponse);

      const { result } = renderHook(() => useResumenTimetracking(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/timetracking/resumen', {});
      expect(result.current.data).toEqual(mockResumenResponse);
    });

    it('debe pasar filtros al resumen', async () => {
      apiMocks.get.mockResolvedValue(mockResumenResponse);

      const { result } = renderHook(
        () => useResumenTimetracking({ usuarioId: 'user-1', proyectoId: 'proj-1' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/timetracking/resumen', {
        usuarioId: 'user-1',
        proyectoId: 'proj-1',
      });
    });
  });

  // ============================================================================
  // useCreateTimeEntry Tests
  // ============================================================================
  describe('useCreateTimeEntry', () => {
    it('debe crear un registro', async () => {
      apiMocks.post.mockResolvedValue(mockTimeEntry);

      const { result } = renderHook(() => useCreateTimeEntry(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        proyectoId: 'proyecto-1',
        fecha: '2024-06-15',
        horas: 8,
        descripcion: 'Trabajo realizado',
        facturable: true,
      });

      expect(apiMocks.post).toHaveBeenCalledWith('/timetracking', {
        proyectoId: 'proyecto-1',
        fecha: '2024-06-15',
        horas: 8,
        descripcion: 'Trabajo realizado',
        facturable: true,
      });
    });

    it('debe manejar errores de creación', async () => {
      const error = { message: 'Error al crear' };
      apiMocks.post.mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useCreateTimeEntry(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({
          proyectoId: 'proyecto-1',
          fecha: '2024-06-15',
          horas: 8,
          descripcion: 'Trabajo',
        })
      ).rejects.toEqual(error);

      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // useUpdateTimeEntry Tests
  // ============================================================================
  describe('useUpdateTimeEntry', () => {
    it('debe actualizar un registro', async () => {
      apiMocks.put.mockResolvedValue({ ...mockTimeEntry, horas: 6 });

      const { result } = renderHook(() => useUpdateTimeEntry(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        id: 'entry-1',
        data: { horas: 6 },
      });

      expect(apiMocks.put).toHaveBeenCalledWith('/timetracking/entry-1', {
        horas: 6,
      });
    });
  });

  // ============================================================================
  // useDeleteTimeEntry Tests
  // ============================================================================
  describe('useDeleteTimeEntry', () => {
    it('debe eliminar un registro', async () => {
      apiMocks.del.mockResolvedValue({ message: 'Eliminado' });

      const { result } = renderHook(() => useDeleteTimeEntry(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync('entry-1');

      expect(apiMocks.del).toHaveBeenCalledWith('/timetracking/entry-1');
    });
  });

  // ============================================================================
  // useAprobarTimeEntry Tests
  // ============================================================================
  describe('useAprobarTimeEntry', () => {
    it('debe aprobar un registro', async () => {
      apiMocks.patch.mockResolvedValue({ ...mockTimeEntry, estado: 'APROBADO' });

      const { result } = renderHook(() => useAprobarTimeEntry(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ id: 'entry-1' });

      expect(apiMocks.patch).toHaveBeenCalledWith('/timetracking/entry-1/aprobar', {});
    });

    it('debe aprobar con comentario', async () => {
      apiMocks.patch.mockResolvedValue({ ...mockTimeEntry, estado: 'APROBADO' });

      const { result } = renderHook(() => useAprobarTimeEntry(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        id: 'entry-1',
        comentario: 'Aprobado correctamente',
      });

      expect(apiMocks.patch).toHaveBeenCalledWith('/timetracking/entry-1/aprobar', {
        comentario: 'Aprobado correctamente',
      });
    });
  });

  // ============================================================================
  // useRechazarTimeEntry Tests
  // ============================================================================
  describe('useRechazarTimeEntry', () => {
    it('debe rechazar un registro con comentario', async () => {
      apiMocks.patch.mockResolvedValue({ ...mockTimeEntry, estado: 'RECHAZADO' });

      const { result } = renderHook(() => useRechazarTimeEntry(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        id: 'entry-1',
        comentario: 'Horas incorrectas',
      });

      expect(apiMocks.patch).toHaveBeenCalledWith('/timetracking/entry-1/rechazar', {
        comentario: 'Horas incorrectas',
      });
    });
  });

  // ============================================================================
  // useAprobarMasivo Tests
  // ============================================================================
  describe('useAprobarMasivo', () => {
    it('debe aprobar múltiples registros', async () => {
      apiMocks.post.mockResolvedValue({ message: 'Aprobados 5 registros' });

      const { result } = renderHook(() => useAprobarMasivo(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync(['entry-1', 'entry-2', 'entry-3']);

      expect(apiMocks.post).toHaveBeenCalledWith('/timetracking/aprobar-masivo', {
        ids: ['entry-1', 'entry-2', 'entry-3'],
      });
    });
  });

  // ============================================================================
  // useCopiarRegistros Tests
  // ============================================================================
  describe('useCopiarRegistros', () => {
    it('debe copiar registros de una fecha a otra', async () => {
      apiMocks.post.mockResolvedValue({ copied: 5, message: 'Copiados 5 registros' });

      const { result } = renderHook(() => useCopiarRegistros(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        fechaOrigen: '2024-06-14',
        fechaDestino: '2024-06-15',
      });

      expect(apiMocks.post).toHaveBeenCalledWith('/timetracking/copiar', {
        fechaOrigen: '2024-06-14',
        fechaDestino: '2024-06-15',
      });
    });
  });
});
