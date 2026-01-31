import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  useDepartamentos,
  useDepartamento,
  useCreateDepartamento,
  useUpdateDepartamento,
  useDeleteDepartamento,
  type Departamento,
  type DepartamentoListResponse,
} from '../use-departamentos';

// Mock de la API
const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  get: apiMocks.get,
  post: apiMocks.post,
  put: apiMocks.put,
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
 * Tests para use-departamentos hook
 * Cobertura objetivo: 80%+
 */
describe('use-departamentos', () => {
  const mockDepartamento: Departamento = {
    id: 'dept-1',
    nombre: 'Tecnología',
    descripcion: 'Departamento de TI',
    codigo: 'TEC',
    activo: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockDepartamentosResponse: DepartamentoListResponse = {
    data: [mockDepartamento],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // useDepartamentos Tests
  // ============================================================================
  describe('useDepartamentos', () => {
    it('debe obtener lista de departamentos', async () => {
      apiMocks.get.mockResolvedValue(mockDepartamentosResponse);

      const { result } = renderHook(() => useDepartamentos(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/departamentos', {});
      expect(result.current.data).toEqual(mockDepartamentosResponse);
    });

    it('debe pasar filtro de búsqueda', async () => {
      apiMocks.get.mockResolvedValue(mockDepartamentosResponse);

      const { result } = renderHook(
        () => useDepartamentos({ search: 'Tecnología' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/departamentos', {
        search: 'Tecnología',
      });
    });

    it('debe pasar filtro de activo', async () => {
      apiMocks.get.mockResolvedValue(mockDepartamentosResponse);

      const { result } = renderHook(
        () => useDepartamentos({ activo: true }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/departamentos', {
        activo: 'true',
      });
    });

    it('debe combinar múltiples filtros', async () => {
      apiMocks.get.mockResolvedValue(mockDepartamentosResponse);

      const { result } = renderHook(
        () => useDepartamentos({ search: 'IT', activo: false }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/departamentos', {
        search: 'IT',
        activo: 'false',
      });
    });

    it('debe retornar loading mientras carga', () => {
      apiMocks.get.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useDepartamentos(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('debe manejar errores', async () => {
      const error = { message: 'Error de red' };
      apiMocks.get.mockRejectedValue(error);

      const { result } = renderHook(() => useDepartamentos(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  // ============================================================================
  // useDepartamento Tests
  // ============================================================================
  describe('useDepartamento', () => {
    it('debe obtener un departamento por ID', async () => {
      apiMocks.get.mockResolvedValue(mockDepartamento);

      const { result } = renderHook(() => useDepartamento('dept-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/departamentos/dept-1');
      expect(result.current.data).toEqual(mockDepartamento);
    });

    it('no debe ejecutar query si ID está vacío', () => {
      const { result } = renderHook(() => useDepartamento(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(apiMocks.get).not.toHaveBeenCalled();
    });

    it('no debe ejecutar query si enabled es false', () => {
      const { result } = renderHook(() => useDepartamento('dept-1', false), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(apiMocks.get).not.toHaveBeenCalled();
    });

    it('debe manejar error 404', async () => {
      const error = { status: 404, message: 'No encontrado' };
      apiMocks.get.mockRejectedValue(error);

      const { result } = renderHook(() => useDepartamento('dept-inexistente'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  // ============================================================================
  // useCreateDepartamento Tests
  // ============================================================================
  describe('useCreateDepartamento', () => {
    it('debe crear un departamento', async () => {
      apiMocks.post.mockResolvedValue(mockDepartamento);

      const { result } = renderHook(() => useCreateDepartamento(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        nombre: 'Tecnología',
        codigo: 'TEC',
        descripcion: 'Departamento de TI',
      });

      expect(apiMocks.post).toHaveBeenCalledWith('/departamentos', {
        nombre: 'Tecnología',
        codigo: 'TEC',
        descripcion: 'Departamento de TI',
      });
    });

    it('debe manejar errores de creación', async () => {
      const error = { message: 'Código duplicado' };
      apiMocks.post.mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useCreateDepartamento(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({
          nombre: 'Test',
          codigo: 'TEST',
        })
      ).rejects.toEqual(error);

      consoleSpy.mockRestore();
    });

    it('debe estar en estado loading durante la mutación', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      apiMocks.post.mockReturnValue(promise);

      const { result } = renderHook(() => useCreateDepartamento(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        nombre: 'Test',
        codigo: 'TEST',
      });

      await waitFor(() => expect(result.current.isPending).toBe(true));

      resolvePromise!(mockDepartamento);
      await waitFor(() => expect(result.current.isPending).toBe(false));
    });
  });

  // ============================================================================
  // useUpdateDepartamento Tests
  // ============================================================================
  describe('useUpdateDepartamento', () => {
    it('debe actualizar un departamento', async () => {
      const updatedDepartamento = { ...mockDepartamento, nombre: 'TI Actualizado' };
      apiMocks.put.mockResolvedValue(updatedDepartamento);

      const { result } = renderHook(() => useUpdateDepartamento(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        id: 'dept-1',
        data: { nombre: 'TI Actualizado' },
      });

      expect(apiMocks.put).toHaveBeenCalledWith('/departamentos/dept-1', {
        nombre: 'TI Actualizado',
      });
    });

    it('debe actualizar múltiples campos', async () => {
      apiMocks.put.mockResolvedValue({
        ...mockDepartamento,
        nombre: 'Nuevo Nombre',
        descripcion: 'Nueva descripción',
      });

      const { result } = renderHook(() => useUpdateDepartamento(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        id: 'dept-1',
        data: {
          nombre: 'Nuevo Nombre',
          descripcion: 'Nueva descripción',
        },
      });

      expect(apiMocks.put).toHaveBeenCalledWith('/departamentos/dept-1', {
        nombre: 'Nuevo Nombre',
        descripcion: 'Nueva descripción',
      });
    });

    it('debe manejar errores de actualización', async () => {
      const error = { message: 'No autorizado' };
      apiMocks.put.mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useUpdateDepartamento(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({
          id: 'dept-1',
          data: { nombre: 'Test' },
        })
      ).rejects.toEqual(error);

      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // useDeleteDepartamento Tests
  // ============================================================================
  describe('useDeleteDepartamento', () => {
    it('debe eliminar un departamento', async () => {
      apiMocks.del.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteDepartamento(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync('dept-1');

      expect(apiMocks.del).toHaveBeenCalledWith('/departamentos/dept-1');
    });

    it('debe manejar errores de eliminación', async () => {
      const error = { message: 'Departamento tiene empleados asociados' };
      apiMocks.del.mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useDeleteDepartamento(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.mutateAsync('dept-1')).rejects.toEqual(error);

      consoleSpy.mockRestore();
    });

    it('debe marcar isSuccess después de eliminar', async () => {
      apiMocks.del.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteDepartamento(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync('dept-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });
});
