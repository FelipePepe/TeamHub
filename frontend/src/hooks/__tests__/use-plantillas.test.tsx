import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  usePlantillas,
  usePlantilla,
  useCreatePlantilla,
  useUpdatePlantilla,
  useDeletePlantilla,
  useDuplicatePlantilla,
  useTareasPlantilla,
  useCreateTareaPlantilla,
  useUpdateTareaPlantilla,
  useDeleteTareaPlantilla,
  type Plantilla,
  type TareaPlantilla,
  type PlantillaFilters,
  type PlantillaListResponse,
  type TareasPlantillaListResponse,
} from '../use-plantillas';

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

describe('usePlantillas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPlantilla: Plantilla = {
    id: 'plantilla-1',
    nombre: 'Onboarding Desarrollador',
    descripcion: 'Plantilla para nuevos desarrolladores',
    departamentoId: 'dept-1',
    departamentoNombre: 'Tecnología',
    rolDestino: 'EMPLEADO',
    duracionEstimadaDias: 30,
    activo: true,
    totalTareas: 5,
    creadoPor: 'user-1',
    creadoEn: '2024-01-01T00:00:00Z',
    actualizadoEn: '2024-01-01T00:00:00Z',
  };

  const mockPlantillasResponse: PlantillaListResponse = {
    plantillas: [mockPlantilla],
    total: 1,
  };

  const mockTarea: TareaPlantilla = {
    id: 'tarea-1',
    plantillaId: 'plantilla-1',
    titulo: 'Configurar equipo',
    descripcion: 'Instalar software necesario',
    orden: 1,
    categoria: 'EQUIPAMIENTO',
    responsable: 'IT',
    duracionEstimadaDias: 1,
    esOpcional: false,
    requiereAprobacion: false,
    creadoEn: '2024-01-01T00:00:00Z',
    actualizadoEn: '2024-01-01T00:00:00Z',
  };

  const mockTareasResponse: TareasPlantillaListResponse = {
    tareas: [mockTarea],
    total: 1,
  };

  describe('usePlantillas', () => {
    it('debe obtener lista de plantillas sin filtros', async () => {
      apiMocks.get.mockResolvedValue(mockPlantillasResponse);

      const { result } = renderHook(() => usePlantillas(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/plantillas', {});
      expect(result.current.data).toEqual(mockPlantillasResponse);
    });

    it('debe aplicar filtros correctamente', async () => {
      apiMocks.get.mockResolvedValue(mockPlantillasResponse);

      const filters: PlantillaFilters = {
        activo: true,
        departamentoId: 'dept-1',
      };

      const { result } = renderHook(() => usePlantillas(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/plantillas', {
        activo: 'true',
        departamentoId: 'dept-1',
      });
    });
  });

  describe('usePlantilla', () => {
    it('debe obtener una plantilla por ID', async () => {
      apiMocks.get.mockResolvedValue(mockPlantilla);

      const { result } = renderHook(() => usePlantilla('plantilla-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/plantillas/plantilla-1');
      expect(result.current.data).toEqual(mockPlantilla);
    });

    it('no debe ejecutar la query si el ID está vacío', () => {
      const { result } = renderHook(() => usePlantilla(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(apiMocks.get).not.toHaveBeenCalled();
    });

    it('no debe ejecutar la query si enabled es false', () => {
      const { result } = renderHook(() => usePlantilla('plantilla-1', false), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(apiMocks.get).not.toHaveBeenCalled();
    });
  });

  describe('useCreatePlantilla', () => {
    it('debe crear una plantilla y invalidar queries', async () => {
      apiMocks.post.mockResolvedValue(mockPlantilla);

      const { result } = renderHook(() => useCreatePlantilla(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        nombre: 'Nueva Plantilla',
        descripcion: 'Descripción de prueba',
        departamentoId: 'dept-1',
        rolDestino: 'EMPLEADO',
        duracionEstimadaDias: 30,
        activo: true,
      });

      expect(apiMocks.post).toHaveBeenCalledWith('/plantillas', {
        nombre: 'Nueva Plantilla',
        descripcion: 'Descripción de prueba',
        departamentoId: 'dept-1',
        rolDestino: 'EMPLEADO',
        duracionEstimadaDias: 30,
        activo: true,
      });
    });
  });

  describe('useUpdatePlantilla', () => {
    it('debe actualizar una plantilla', async () => {
      const updatedPlantilla = { ...mockPlantilla, nombre: 'Nombre Actualizado' };
      apiMocks.put.mockResolvedValue(updatedPlantilla);

      const { result } = renderHook(() => useUpdatePlantilla(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        id: 'plantilla-1',
        data: { nombre: 'Nombre Actualizado' },
      });

      expect(apiMocks.put).toHaveBeenCalledWith('/plantillas/plantilla-1', {
        nombre: 'Nombre Actualizado',
      });
    });
  });

  describe('useDeletePlantilla', () => {
    it('debe eliminar una plantilla', async () => {
      apiMocks.del.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeletePlantilla(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync('plantilla-1');

      expect(apiMocks.del).toHaveBeenCalledWith('/plantillas/plantilla-1');
    });
  });

  describe('useDuplicatePlantilla', () => {
    it('debe duplicar una plantilla', async () => {
      const duplicatedPlantilla = {
        ...mockPlantilla,
        id: 'plantilla-2',
        nombre: 'Onboarding Desarrollador (Copia)',
      };
      apiMocks.post.mockResolvedValue(duplicatedPlantilla);

      const { result } = renderHook(() => useDuplicatePlantilla(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync('plantilla-1');

      expect(apiMocks.post).toHaveBeenCalledWith(
        '/plantillas/plantilla-1/duplicar',
        {}
      );
    });
  });

  describe('useTareasPlantilla', () => {
    it('debe obtener tareas de una plantilla', async () => {
      apiMocks.get.mockResolvedValue(mockTareasResponse);

      const { result } = renderHook(
        () => useTareasPlantilla('plantilla-1'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/plantillas/plantilla-1/tareas');
      expect(result.current.data).toEqual(mockTareasResponse);
    });

    it('no debe ejecutar la query si el plantillaId está vacío', () => {
      const { result } = renderHook(() => useTareasPlantilla(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(apiMocks.get).not.toHaveBeenCalled();
    });
  });

  describe('useCreateTareaPlantilla', () => {
    it('debe crear una tarea en una plantilla', async () => {
      apiMocks.post.mockResolvedValue(mockTarea);

      const { result } = renderHook(() => useCreateTareaPlantilla(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        plantillaId: 'plantilla-1',
        data: {
          titulo: 'Nueva Tarea',
          orden: 1,
          categoria: 'EQUIPAMIENTO',
          responsable: 'IT',
          esOpcional: false,
          requiereAprobacion: false,
        },
      });

      expect(apiMocks.post).toHaveBeenCalledWith(
        '/plantillas/plantilla-1/tareas',
        {
          titulo: 'Nueva Tarea',
          orden: 1,
          categoria: 'EQUIPAMIENTO',
          responsable: 'IT',
          esOpcional: false,
          requiereAprobacion: false,
        }
      );
    });
  });

  describe('useUpdateTareaPlantilla', () => {
    it('debe actualizar una tarea de plantilla', async () => {
      const updatedTarea = { ...mockTarea, titulo: 'Título Actualizado' };
      apiMocks.put.mockResolvedValue(updatedTarea);

      const { result } = renderHook(() => useUpdateTareaPlantilla(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        plantillaId: 'plantilla-1',
        tareaId: 'tarea-1',
        data: { titulo: 'Título Actualizado' },
      });

      expect(apiMocks.put).toHaveBeenCalledWith(
        '/plantillas/plantilla-1/tareas/tarea-1',
        { titulo: 'Título Actualizado' }
      );
    });
  });

  describe('useDeleteTareaPlantilla', () => {
    it('debe eliminar una tarea de plantilla', async () => {
      apiMocks.del.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteTareaPlantilla(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        plantillaId: 'plantilla-1',
        tareaId: 'tarea-1',
      });

      expect(apiMocks.del).toHaveBeenCalledWith(
        '/plantillas/plantilla-1/tareas/tarea-1'
      );
    });
  });

  describe('Dependencias entre tareas', () => {
    it('debe manejar tareas con dependencias', async () => {
      const tareaConDependencias: TareaPlantilla = {
        ...mockTarea,
        id: 'tarea-2',
        dependencias: ['tarea-1'], // Depende de tarea-1
      };

      apiMocks.post.mockResolvedValue(tareaConDependencias);

      const { result } = renderHook(() => useCreateTareaPlantilla(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        plantillaId: 'plantilla-1',
        data: {
          titulo: 'Tarea con Dependencias',
          orden: 2,
          categoria: 'FORMACION',
          responsable: 'RRHH',
          dependencias: ['tarea-1'],
        },
      });

      expect(apiMocks.post).toHaveBeenCalledWith(
        '/plantillas/plantilla-1/tareas',
        expect.objectContaining({
          dependencias: ['tarea-1'],
        })
      );
    });
  });
});
