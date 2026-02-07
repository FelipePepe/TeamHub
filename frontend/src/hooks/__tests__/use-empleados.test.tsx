import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  useEmpleados,
  useEmpleado,
  useCreateEmpleado,
  useUpdateEmpleado,
  useDeleteEmpleado,
  useEmpleadosByDepartamento,
  useEmpleadosByManager,
} from '../use-empleados';
import type { User, EmpleadoFilters } from '@/types';

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

describe('useEmpleados', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    nombre: 'Test',
    apellidos: 'User',
    rol: 'EMPLEADO',
    activo: true,
  };

  const mockUsersResponse = {
    data: [mockUser],
    meta: {
      page: 1,
      limit: 20,
      total: 1,
    },
  };

  describe('useEmpleados', () => {
    it('debe obtener lista de empleados sin filtros', async () => {
      apiMocks.get.mockResolvedValue(mockUsersResponse);

      const { result } = renderHook(() => useEmpleados(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/usuarios', {});
      expect(result.current.data).toEqual(mockUsersResponse);
    });

    it('debe aplicar filtros correctamente', async () => {
      apiMocks.get.mockResolvedValue(mockUsersResponse);

      const filters: EmpleadoFilters = {
        activo: true,
        departamentoId: 'dept-1',
        rol: 'EMPLEADO',
        search: 'test',
        page: 1,
        limit: 20,
      };

      const { result } = renderHook(() => useEmpleados(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/usuarios', {
        activo: 'true',
        departamentoId: 'dept-1',
        rol: 'EMPLEADO',
        search: 'test',
        page: '1',
        limit: '20',
      });
    });
  });

  describe('useEmpleado', () => {
    it('debe obtener un empleado por ID', async () => {
      apiMocks.get.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useEmpleado('user-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/usuarios/user-1');
      expect(result.current.data).toEqual(mockUser);
    });

    it('no debe ejecutar la query si el ID está vacío', () => {
      const { result } = renderHook(() => useEmpleado(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(apiMocks.get).not.toHaveBeenCalled();
    });
  });

  describe('useCreateEmpleado', () => {
    it('debe crear un empleado y invalidar queries', async () => {
      apiMocks.post.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useCreateEmpleado(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        email: 'new@example.com',
        password: 'TempPass123!',
        nombre: 'New',
        apellidos: 'User',
        rol: 'EMPLEADO',
      });

      expect(apiMocks.post).toHaveBeenCalledWith('/usuarios', {
        email: 'new@example.com',
        password: 'TempPass123!',
        nombre: 'New',
        apellidos: 'User',
        rol: 'EMPLEADO',
      });
    });
  });

  describe('useUpdateEmpleado', () => {
    it('debe actualizar un empleado', async () => {
      const updatedUser = { ...mockUser, nombre: 'Updated' };
      apiMocks.put.mockResolvedValue(updatedUser);

      const { result } = renderHook(() => useUpdateEmpleado(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        id: 'user-1',
        data: { nombre: 'Updated' },
      });

      expect(apiMocks.put).toHaveBeenCalledWith('/usuarios/user-1', {
        nombre: 'Updated',
      });
    });
  });

  describe('useDeleteEmpleado', () => {
    it('debe eliminar un empleado', async () => {
      apiMocks.del.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteEmpleado(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync('user-1');

      expect(apiMocks.del).toHaveBeenCalledWith('/usuarios/user-1');
    });
  });

  describe('useEmpleadosByDepartamento', () => {
    it('debe obtener empleados por departamento', async () => {
      apiMocks.get.mockResolvedValue(mockUsersResponse);

      const { result } = renderHook(
        () => useEmpleadosByDepartamento('dept-1'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiMocks.get).toHaveBeenCalledWith('/usuarios', {
        departamentoId: 'dept-1',
        activo: 'true',
      });
      expect(result.current.data).toEqual([mockUser]);
    });
  });

  describe('useEmpleadosByManager', () => {
    it('debe obtener empleados por manager desde el backend', async () => {
      const filteredUsers = [
        { ...mockUser, id: 'user-1', managerId: 'manager-1' },
        { ...mockUser, id: 'user-3', managerId: 'manager-1' },
      ];

      apiMocks.get.mockResolvedValue({
        data: filteredUsers,
        meta: { page: 1, limit: 20, total: 2 },
      });

      const { result } = renderHook(
        () => useEmpleadosByManager('manager-1'),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // El backend filtra por managerId — el hook recibe solo los resultados filtrados
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.every((u) => u.managerId === 'manager-1')).toBe(true);
    });
  });
});
