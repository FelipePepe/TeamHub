import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { ReactNode } from 'react';
import EmpleadosPage from '../page';
import type { User } from '@/types';

// Mock de hooks
const mockUseEmpleados = vi.fn();
const mockUseDeleteEmpleado = vi.fn();
const mockUsePermissions = vi.fn();
const mockUseRouter = vi.fn();

vi.mock('@/hooks/use-empleados', () => ({
  useEmpleados: (filters?: unknown) => mockUseEmpleados(filters),
  useDeleteEmpleado: () => mockUseDeleteEmpleado(),
}));

vi.mock('@/hooks/use-permissions', () => ({
  usePermissions: () => mockUsePermissions(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return QueryClientWrapper;
}

describe('EmpleadosPage', () => {
  const mockEmpleados: User[] = [
    {
      id: '1',
      email: 'empleado1@example.com',
      nombre: 'Juan',
      apellidos: 'Pérez',
      rol: 'EMPLEADO',
      activo: true,
    },
    {
      id: '2',
      email: 'empleado2@example.com',
      nombre: 'María',
      apellidos: 'García',
      rol: 'MANAGER',
      activo: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermissions.mockReturnValue({
      canManageUsers: true,
    });
    mockUseRouter.mockReturnValue({
      push: vi.fn(),
    });
    mockUseDeleteEmpleado.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('debe mostrar mensaje de acceso denegado si no tiene permisos', () => {
    mockUsePermissions.mockReturnValue({
      canManageUsers: false,
    });
    mockUseEmpleados.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    render(<EmpleadosPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Acceso denegado')).toBeInTheDocument();
  });

  it('debe mostrar skeletons mientras carga', () => {
    mockUseEmpleados.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const { container } = render(<EmpleadosPage />, { wrapper: createWrapper() });

    // Verificar que hay elementos con clase skeleton (Skeleton component usa animate-pulse)
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('debe mostrar lista de empleados cuando hay datos', async () => {
    mockUseEmpleados.mockReturnValue({
      data: {
        data: mockEmpleados,
        meta: {
          page: 1,
          limit: 20,
          total: 2,
        },
      },
      isLoading: false,
      error: null,
    });

    render(<EmpleadosPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('María García')).toBeInTheDocument();
    });
  });

  it('debe mostrar mensaje cuando no hay empleados', async () => {
    mockUseEmpleados.mockReturnValue({
      data: {
        data: [],
        meta: {
          page: 1,
          limit: 20,
          total: 0,
        },
      },
      isLoading: false,
      error: null,
    });

    render(<EmpleadosPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(
        screen.getByText(/No se encontraron empleados/i)
      ).toBeInTheDocument();
    });
  });

  it('debe filtrar por búsqueda', async () => {
    const user = userEvent.setup();
    mockUseEmpleados.mockReturnValue({
      data: {
        data: mockEmpleados,
        meta: {
          page: 1,
          limit: 20,
          total: 2,
        },
      },
      isLoading: false,
      error: null,
    });

    render(<EmpleadosPage />, { wrapper: createWrapper() });

    const searchInputs = screen.getAllByPlaceholderText(/buscar por nombre/i);
    const searchInput = searchInputs[0];
    await user.type(searchInput, 'Juan');

    await waitFor(() => {
      expect(mockUseEmpleados).toHaveBeenCalled();
    });
  });

  it('debe mostrar botón crear empleado', async () => {
    mockUseEmpleados.mockReturnValue({
      data: {
        data: [],
        meta: { page: 1, limit: 20, total: 0 },
      },
      isLoading: false,
      error: null,
    });

    render(<EmpleadosPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const crearButton = buttons.find((btn) =>
        btn.textContent?.includes('Crear empleado')
      );
      expect(crearButton).toBeInTheDocument();
    });
  });
});
