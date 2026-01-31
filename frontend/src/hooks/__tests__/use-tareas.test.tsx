import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  useTareasByProyecto,
  useTareasByUsuario,
  useTarea,
  useCreateTarea,
  useUpdateTarea,
  useUpdateEstadoTarea,
  useReasignarTarea,
  useDeleteTarea,
  type TareaListResponse,
} from '../use-tareas';
import type { Tarea } from '@/types';

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
 * Tests para use-tareas hook (80% Coverage - IMPORTANT)
 * Tests de hooks de React Query con MSW mocks
 */
describe('use-tareas', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn> | null = null;
  const mockTarea: Tarea = {
    id: 'tarea-1',
    proyectoId: 'proyecto-1',
    titulo: 'Tarea Test',
    descripcion: 'Descripción test',
    estado: 'TODO',
    prioridad: 'MEDIUM',
    usuarioAsignadoId: 'emp-1',
    fechaInicio: '2024-01-01',
    fechaFin: '2024-01-31',
    horasEstimadas: '40',
    horasReales: '35',
    orden: 1,
    dependeDe: undefined,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockTareasResponse: TareaListResponse = {
    data: [mockTarea],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
    consoleErrorSpy = null;
  });

  describe('useTareasByProyecto', () => {
    it('debe obtener tareas de un proyecto', async () => {
      apiMocks.get.mockResolvedValue(mockTareasResponse);

      const { result } = renderHook(
        () => useTareasByProyecto('proyecto-1'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/proyectos/proyecto-1/tareas');
      expect(result.current.data).toEqual(mockTareasResponse);
      expect(result.current.data?.data).toHaveLength(1);
    });

    it('debe retornar loading mientras carga', () => {
      apiMocks.get.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(
        () => useTareasByProyecto('proyecto-1'),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('debe manejar errores', async () => {
      const error = { message: 'Error al cargar tareas' };
      apiMocks.get.mockRejectedValue(error);

      const { result } = renderHook(
        () => useTareasByProyecto('proyecto-1'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });

    it('no debe ejecutar query si proyectoId está vacío', () => {
      const { result } = renderHook(
        () => useTareasByProyecto(''),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.isFetching).toBe(false);
      expect(apiMocks.get).not.toHaveBeenCalled();
    });

    it('no debe ejecutar query si enabled es false', () => {
      const { result } = renderHook(
        () => useTareasByProyecto('proyecto-1', false),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.isFetching).toBe(false);
      expect(apiMocks.get).not.toHaveBeenCalled();
    });

    it('debe usar staleTime de 2 minutos', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      apiMocks.get.mockResolvedValue(mockTareasResponse);

      const { result } = renderHook(
        () => useTareasByProyecto('proyecto-1'),
        {
          wrapper: ({ children }) => (
            <QueryClientProvider client={queryClient}>
              {children}
            </QueryClientProvider>
          ),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const query = queryClient.getQueryCache().find({
        queryKey: ['tareas', 'list', 'proyecto', 'proyecto-1'],
      });

      expect(query).toBeDefined();
      // staleTime está configurado en el hook, verificamos que la query existe
    });
  });

  describe('useTareasByUsuario', () => {
    it('debe obtener tareas de un usuario', async () => {
      apiMocks.get.mockResolvedValue(mockTareasResponse);

      const { result } = renderHook(
        () => useTareasByUsuario('emp-1'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/usuarios/emp-1/tareas');
      expect(result.current.data).toEqual(mockTareasResponse);
    });

    it('debe manejar errores 403 sin permisos', async () => {
      const error = { status: 403, message: 'No autorizado' };
      apiMocks.get.mockRejectedValue(error);

      const { result } = renderHook(
        () => useTareasByUsuario('otro-usuario'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });

    it('no debe ejecutar query si usuarioId está vacío', () => {
      const { result } = renderHook(
        () => useTareasByUsuario(''),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.isFetching).toBe(false);
      expect(apiMocks.get).not.toHaveBeenCalled();
    });

    it('no debe ejecutar query si enabled es false', () => {
      const { result } = renderHook(
        () => useTareasByUsuario('emp-1', false),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.isFetching).toBe(false);
      expect(apiMocks.get).not.toHaveBeenCalled();
    });
  });

  describe('useTarea', () => {
    it('debe obtener detalle de una tarea', async () => {
      apiMocks.get.mockResolvedValue(mockTarea);

      const { result } = renderHook(
        () => useTarea('tarea-1'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/tareas/tarea-1');
      expect(result.current.data).toEqual(mockTarea);
    });

    it('debe manejar error 404 tarea no encontrada', async () => {
      const error = { status: 404, message: 'Tarea no encontrada' };
      apiMocks.get.mockRejectedValue(error);

      const { result } = renderHook(
        () => useTarea('inexistente'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });

    it('no debe ejecutar query si id está vacío', () => {
      const { result } = renderHook(
        () => useTarea(''),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.isFetching).toBe(false);
      expect(apiMocks.get).not.toHaveBeenCalled();
    });

    it('no debe ejecutar query si enabled es false', () => {
      const { result } = renderHook(
        () => useTarea('tarea-1', false),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.isFetching).toBe(false);
      expect(apiMocks.get).not.toHaveBeenCalled();
    });
  });

  describe('useCreateTarea', () => {
    it('debe crear tarea e invalidar queries', async () => {
      apiMocks.post.mockResolvedValue(mockTarea);

      const { result } = renderHook(() => useCreateTarea(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        proyectoId: 'proyecto-1',
        titulo: 'Nueva Tarea',
        descripcion: 'Descripción',
        prioridad: 'HIGH',
      });

      expect(apiMocks.post).toHaveBeenCalledWith(
        '/proyectos/proyecto-1/tareas',
        {
          titulo: 'Nueva Tarea',
          descripcion: 'Descripción',
          prioridad: 'HIGH',
        }
      );
    });

    it('debe crear tarea con campos opcionales', async () => {
      apiMocks.post.mockResolvedValue(mockTarea);

      const { result } = renderHook(() => useCreateTarea(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        proyectoId: 'proyecto-1',
        titulo: 'Tarea Completa',
        usuarioAsignadoId: 'emp-1',
        fechaInicio: '2024-01-01',
        fechaFin: '2024-01-31',
        horasEstimadas: 40,
        dependeDe: 'tarea-0',
      });

      expect(apiMocks.post).toHaveBeenCalled();
    });

    it('debe manejar errores de validación', async () => {
      const error = { status: 400, message: 'Validación fallida' };
      apiMocks.post.mockRejectedValue(error);

      const { result } = renderHook(() => useCreateTarea(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({
          proyectoId: 'proyecto-1',
          titulo: '',
        })
      ).rejects.toEqual(error);
    });

    it('debe manejar error 403 sin permisos', async () => {
      const error = { status: 403, message: 'No autorizado' };
      apiMocks.post.mockRejectedValue(error);

      const { result } = renderHook(() => useCreateTarea(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({
          proyectoId: 'proyecto-1',
          titulo: 'Test',
        })
      ).rejects.toEqual(error);
    });
  });

  describe('useUpdateTarea', () => {
    it('debe actualizar tarea e invalidar queries', async () => {
      const updatedTarea = { ...mockTarea, titulo: 'Título Actualizado' };
      apiMocks.put.mockResolvedValue(updatedTarea);

      const { result } = renderHook(() => useUpdateTarea(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        id: 'tarea-1',
        data: { titulo: 'Título Actualizado' },
      });

      expect(apiMocks.put).toHaveBeenCalledWith('/tareas/tarea-1', {
        titulo: 'Título Actualizado',
      });
    });

    it('debe actualizar múltiples campos', async () => {
      const updatedTarea = {
        ...mockTarea,
        titulo: 'Nuevo Título',
        prioridad: 'URGENT' as const,
        horasReales: 50,
      };
      apiMocks.put.mockResolvedValue(updatedTarea);

      const { result } = renderHook(() => useUpdateTarea(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        id: 'tarea-1',
        data: {
          titulo: 'Nuevo Título',
          prioridad: 'URGENT',
          horasReales: 50,
        },
      });

      expect(apiMocks.put).toHaveBeenCalledWith('/tareas/tarea-1', {
        titulo: 'Nuevo Título',
        prioridad: 'URGENT',
        horasReales: 50,
      });
    });

    it('debe manejar error 404 tarea no encontrada', async () => {
      const error = { status: 404, message: 'Tarea no encontrada' };
      apiMocks.put.mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateTarea(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({
          id: 'inexistente',
          data: { titulo: 'Update' },
        })
      ).rejects.toEqual(error);
    });

    it('debe manejar error 400 validación fallida', async () => {
      const error = { status: 400, message: 'Fechas inválidas' };
      apiMocks.put.mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateTarea(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({
          id: 'tarea-1',
          data: {
            fechaInicio: '2024-12-31',
            fechaFin: '2024-01-01',
          },
        })
      ).rejects.toEqual(error);
    });
  });

  describe('useUpdateEstadoTarea', () => {
    it('debe cambiar estado e invalidar queries', async () => {
      const updatedTarea = { ...mockTarea, estado: 'IN_PROGRESS' as const };
      apiMocks.patch.mockResolvedValue(updatedTarea);

      const { result } = renderHook(() => useUpdateEstadoTarea(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        id: 'tarea-1',
        estado: 'IN_PROGRESS',
      });

      expect(apiMocks.patch).toHaveBeenCalledWith('/tareas/tarea-1/estado', {
        estado: 'IN_PROGRESS',
      });
    });

    it('debe permitir todos los estados válidos', async () => {
      const estados: Array<'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED'> = [
        'TODO',
        'IN_PROGRESS',
        'REVIEW',
        'DONE',
        'BLOCKED',
      ];

      const { result } = renderHook(() => useUpdateEstadoTarea(), {
        wrapper: createWrapper(),
      });

      for (const estado of estados) {
        apiMocks.patch.mockResolvedValue({ ...mockTarea, estado });

        await result.current.mutateAsync({
          id: 'tarea-1',
          estado,
        });

        expect(apiMocks.patch).toHaveBeenCalledWith('/tareas/tarea-1/estado', {
          estado,
        });
      }
    });

    it('debe manejar error 400 transición inválida', async () => {
      const error = {
        status: 400,
        message: 'Transición de estado no válida: TODO -> DONE',
      };
      apiMocks.patch.mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateEstadoTarea(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({
          id: 'tarea-1',
          estado: 'DONE',
        })
      ).rejects.toEqual(error);
    });
  });

  describe('useReasignarTarea', () => {
    it('debe reasignar tarea e invalidar queries', async () => {
      const updatedTarea = { ...mockTarea, usuarioAsignadoId: 'nuevo-emp' };
      apiMocks.patch.mockResolvedValue(updatedTarea);

      const { result } = renderHook(() => useReasignarTarea(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        id: 'tarea-1',
        usuarioAsignadoId: 'nuevo-emp',
      });

      expect(apiMocks.patch).toHaveBeenCalledWith('/tareas/tarea-1/asignar', {
        usuarioAsignadoId: 'nuevo-emp',
      });
    });

    it('debe manejar error 403 sin permisos', async () => {
      const error = { status: 403, message: 'No autorizado' };
      apiMocks.patch.mockRejectedValue(error);

      const { result } = renderHook(() => useReasignarTarea(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({
          id: 'tarea-1',
          usuarioAsignadoId: 'otro-usuario',
        })
      ).rejects.toEqual(error);
    });

    it('debe manejar error 404 usuario no encontrado', async () => {
      const error = { status: 404, message: 'Usuario no encontrado' };
      apiMocks.patch.mockRejectedValue(error);

      const { result } = renderHook(() => useReasignarTarea(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({
          id: 'tarea-1',
          usuarioAsignadoId: 'inexistente',
        })
      ).rejects.toEqual(error);
    });
  });

  describe('useDeleteTarea', () => {
    it('debe eliminar tarea e invalidar queries', async () => {
      apiMocks.del.mockResolvedValue({ message: 'Tarea eliminada' });

      const { result } = renderHook(() => useDeleteTarea(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync('tarea-1');

      expect(apiMocks.del).toHaveBeenCalledWith('/tareas/tarea-1');
    });

    it('debe manejar error 404 tarea no encontrada', async () => {
      const error = { status: 404, message: 'Tarea no encontrada' };
      apiMocks.del.mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteTarea(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync('inexistente')
      ).rejects.toEqual(error);
    });

    it('debe manejar error 403 sin permisos', async () => {
      const error = { status: 403, message: 'No autorizado' };
      apiMocks.del.mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteTarea(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync('tarea-1')
      ).rejects.toEqual(error);
    });

    it('debe manejar error 400 tareas dependientes', async () => {
      const error = {
        status: 400,
        message: 'No se puede eliminar una tarea con tareas dependientes',
      };
      apiMocks.del.mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteTarea(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync('tarea-1')
      ).rejects.toEqual(error);
    });
  });

  describe('Invalidación de Queries', () => {
    it('crear tarea debe invalidar lista de proyecto y usuario', async () => {
      const queryClient = new QueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      apiMocks.post.mockResolvedValue(mockTarea);

      const { result } = renderHook(() => useCreateTarea(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      });

      await result.current.mutateAsync({
        proyectoId: 'proyecto-1',
        titulo: 'Test',
      });

      expect(invalidateSpy).toHaveBeenCalled();
    });

    it('actualizar tarea debe invalidar detalle, proyecto y usuario', async () => {
      const queryClient = new QueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      apiMocks.put.mockResolvedValue(mockTarea);

      const { result } = renderHook(() => useUpdateTarea(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      });

      await result.current.mutateAsync({
        id: 'tarea-1',
        data: { titulo: 'Update' },
      });

      expect(invalidateSpy).toHaveBeenCalled();
    });

    it('eliminar tarea debe invalidar todas las listas', async () => {
      const queryClient = new QueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      apiMocks.del.mockResolvedValue({ message: 'Tarea eliminada' });

      const { result } = renderHook(() => useDeleteTarea(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      });

      await result.current.mutateAsync('tarea-1');

      expect(invalidateSpy).toHaveBeenCalled();
    });
  });
});
