import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { ReactNode } from 'react';
import EmpleadosPage from '../page';
import type { User } from '@/types';

// Mock del componente Select (evita dependencia de @radix-ui/react-select)
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: { children: React.ReactNode; value: string; onValueChange: (value: string) => void }) => (
    <div data-testid="select-mock">
      <button onClick={() => onValueChange && onValueChange('EMPLEADO')}>{value || 'Select'}</button>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => <option value={value}>{children}</option>,
}));

// Mock de hooks
const mockUseEmpleados = vi.fn();
const mockUseDeleteEmpleado = vi.fn();
const mockUseCreateEmpleado = vi.fn();
const mockUseUpdateEmpleado = vi.fn();
const mockUseDepartamentos = vi.fn();
const mockUsePermissions = vi.fn();
const mockUseRouter = vi.fn();
const routerPushMock = vi.fn();

const mockUseEmpleado = vi.fn();
vi.mock('@/hooks/use-empleados', () => ({
  useEmpleados: (filters?: unknown) => mockUseEmpleados(filters),
  useEmpleado: (id: string, enabled?: boolean) => mockUseEmpleado(id, enabled),
  useDeleteEmpleado: () => mockUseDeleteEmpleado(),
  useCreateEmpleado: () => mockUseCreateEmpleado(),
  useUpdateEmpleado: () => mockUseUpdateEmpleado(),
}));

vi.mock('@/hooks/use-departamentos', () => ({
  useDepartamentos: () => mockUseDepartamentos(),
}));

vi.mock('@/hooks/use-permissions', () => ({
  usePermissions: () => mockUsePermissions(),
}));

const mockSearchParams = { get: vi.fn(() => null) };
vi.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@/components/forms/empleado-form', () => ({
  EmpleadoForm: ({
    open,
    empleado,
  }: {
    open: boolean;
    empleado?: { id?: string };
  }) =>
    open ? <div data-testid="empleado-form-mock">EmpleadoForm {empleado?.id ?? 'nuevo'}</div> : null,
}));

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: toastMocks,
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
      push: routerPushMock,
    });
    routerPushMock.mockReset();
    mockUseDeleteEmpleado.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
    });
    mockUseCreateEmpleado.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
    });
    mockUseUpdateEmpleado.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
    });
    mockUseDepartamentos.mockReturnValue({
      data: { departamentos: [] },
      isLoading: false,
      error: null,
    });
    mockUseEmpleado.mockReturnValue({ data: undefined });
    mockSearchParams.get.mockReturnValue(null);
    toastMocks.success.mockReset();
    toastMocks.error.mockReset();
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

  it('debe mostrar estado de error', async () => {
    mockUseEmpleados.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('boom'),
    });

    render(<EmpleadosPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/error al cargar empleados/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('debe navegar a detalle al pulsar ver', async () => {
    const user = userEvent.setup();
    mockUseEmpleados.mockReturnValue({
      data: {
        data: mockEmpleados,
        meta: { page: 1, limit: 20, total: 2 },
      },
      isLoading: false,
      error: null,
    });

    render(<EmpleadosPage />, { wrapper: createWrapper() });

    await user.click(screen.getAllByTitle('Ver detalle')[0]);

    expect(routerPushMock).toHaveBeenCalledWith('/admin/empleados/1');
  });

  it('debe abrir modal en modo editar', async () => {
    const user = userEvent.setup();
    mockUseEmpleados.mockReturnValue({
      data: {
        data: mockEmpleados,
        meta: { page: 1, limit: 20, total: 2 },
      },
      isLoading: false,
      error: null,
    });

    render(<EmpleadosPage />, { wrapper: createWrapper() });

    await user.click(screen.getAllByTitle('Editar')[0]);

    expect(screen.getByTestId('empleado-form-mock')).toBeInTheDocument();
    expect(screen.getByText(/empleadoform 1/i)).toBeInTheDocument();
  });

  it('debe eliminar empleado al confirmar', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    mockUseDeleteEmpleado.mockReturnValue({ mutateAsync });
    vi.stubGlobal('confirm', vi.fn(() => true));

    mockUseEmpleados.mockReturnValue({
      data: {
        data: mockEmpleados,
        meta: { page: 1, limit: 20, total: 2 },
      },
      isLoading: false,
      error: null,
    });

    render(<EmpleadosPage />, { wrapper: createWrapper() });

    await user.click(screen.getAllByTitle('Eliminar')[0]);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith('1');
      expect(toastMocks.success).toHaveBeenCalled();
    });
  });

  it('no debe eliminar empleado si se cancela confirmación', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    mockUseDeleteEmpleado.mockReturnValue({ mutateAsync });
    vi.stubGlobal('confirm', vi.fn(() => false));

    mockUseEmpleados.mockReturnValue({
      data: {
        data: mockEmpleados,
        meta: { page: 1, limit: 20, total: 2 },
      },
      isLoading: false,
      error: null,
    });

    render(<EmpleadosPage />, { wrapper: createWrapper() });

    await user.click(screen.getAllByTitle('Eliminar')[0]);

    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('debe avanzar de página al pulsar siguiente', async () => {
    const user = userEvent.setup();
    mockUseEmpleados.mockImplementation((filters?: { page?: number; limit?: number }) => ({
      data: {
        data: mockEmpleados,
        meta: { page: filters?.page ?? 1, limit: filters?.limit ?? 20, total: 50 },
      },
      isLoading: false,
      error: null,
    }));

    render(<EmpleadosPage />, { wrapper: createWrapper() });

    await user.click(screen.getByRole('button', { name: /siguiente/i }));

    await waitFor(() => {
      const lastCall = mockUseEmpleados.mock.calls.at(-1)?.[0] as { page?: number };
      expect(lastCall.page).toBe(2);
    });
  });
});
