import React from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmpleadoDetailPage from '../[id]/page';
import type { User } from '@/types';

// Mock de date-fns
vi.mock('date-fns', () => ({
  format: (date: Date | string, formatStr: string) => {
    if (date === '1985-03-15') return '15 de marzo de 1985';
    if (date === '2024-01-15T10:30:00Z') return '15 de enero de 2024';
    if (date === '2024-01-20T14:45:00Z') return '20 de enero de 2024';
    return new Date(date).toLocaleDateString('es-ES');
  },
}));

vi.mock('date-fns/locale', () => ({
  es: {},
}));

// Mock de router
const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
  back: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => routerMocks,
}));

// Mock de hooks
const empleadosMocks = vi.hoisted(() => ({
  data: null as User | null,
  isLoading: false,
  error: null,
  mutateAsync: vi.fn(),
}));

const permissionsMocks = vi.hoisted(() => ({
  canManageUsers: true,
}));

vi.mock('@/hooks/use-empleados', () => ({
  useEmpleado: () => ({
    data: empleadosMocks.data,
    isLoading: empleadosMocks.isLoading,
    error: empleadosMocks.error,
  }),
  useDeleteEmpleado: () => ({
    mutateAsync: empleadosMocks.mutateAsync,
  }),
}));

vi.mock('@/hooks/use-permissions', () => ({
  usePermissions: () => permissionsMocks,
}));

// Mock de toast
const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: toastMocks,
}));

// Mock de confirm
global.confirm = vi.fn();

const mockEmpleado: User = {
  id: 'emp-123',
  email: 'juan.perez@example.com',
  nombre: 'Juan',
  apellidos: 'Pérez García',
  rol: 'MANAGER',
  departamentoId: 'dept-456',
  managerId: 'mgr-789',
  telefono: '+34 600 123 456',
  fechaNacimiento: '1985-03-15',
  activo: true,
  bloqueado: false,
  intentosFallidos: 0,
  mfaActivo: true,
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-20T14:45:00Z',
};

describe('EmpleadoDetailPage', () => {
  beforeEach(() => {
    empleadosMocks.data = null;
    empleadosMocks.isLoading = false;
    empleadosMocks.error = null;
    empleadosMocks.mutateAsync.mockReset();
    permissionsMocks.canManageUsers = true;
    routerMocks.push.mockReset();
    routerMocks.back.mockReset();
    toastMocks.success.mockReset();
    toastMocks.error.mockReset();
    (global.confirm as unknown as ReturnType<typeof vi.fn>).mockReset();
  });

  it('muestra acceso denegado sin permisos', () => {
    permissionsMocks.canManageUsers = false;

    render(<EmpleadoDetailPage params={Promise.resolve({ id: 'emp-123' })} />);

    expect(screen.getByText(/acceso denegado/i)).toBeInTheDocument();
    expect(screen.getByText(/no tienes permisos para ver esta información/i)).toBeInTheDocument();
  });

  describe('Con datos del empleado', () => {
    beforeEach(() => {
      empleadosMocks.data = mockEmpleado;
    });

    it('renderiza información básica del empleado', () => {
      render(<EmpleadoDetailPage params={Promise.resolve({ id: 'emp-123' })} />);

      expect(screen.getByText('Juan Pérez García')).toBeInTheDocument();
      expect(screen.getByText('juan.perez@example.com')).toBeInTheDocument();
      expect(screen.getByText('+34 600 123 456')).toBeInTheDocument();
    });

    it('renderiza información organizacional', () => {
      render(<EmpleadoDetailPage params={Promise.resolve({ id: 'emp-123' })} />);

      expect(screen.getByText('MANAGER')).toBeInTheDocument();
      expect(screen.getByText(/ID: dept-456/i)).toBeInTheDocument();
      expect(screen.getByText(/ID: mgr-789/i)).toBeInTheDocument();
    });

    it('muestra badge de estado activo', () => {
      render(<EmpleadoDetailPage params={Promise.resolve({ id: 'emp-123' })} />);

      const activoBadge = screen.getByText('Activo');
      expect(activoBadge).toBeInTheDocument();
    });

    it('no muestra teléfono si no está presente', () => {
      empleadosMocks.data = { ...mockEmpleado, telefono: null };

      render(<EmpleadoDetailPage params={Promise.resolve({ id: 'emp-123' })} />);

      expect(screen.queryByText('+34 600 123 456')).not.toBeInTheDocument();
    });

    it('muestra "Sin asignar" cuando no hay departamento', () => {
      empleadosMocks.data = { ...mockEmpleado, departamentoId: null };

      render(<EmpleadoDetailPage params={Promise.resolve({ id: 'emp-123' })} />);

      expect(screen.getByText('Sin asignar')).toBeInTheDocument();
    });
  });

  describe('Acciones', () => {
    beforeEach(() => {
      empleadosMocks.data = mockEmpleado;
    });

    it('botón volver navega hacia atrás', async () => {
      const user = userEvent.setup();

      render(<EmpleadoDetailPage params={Promise.resolve({ id: 'emp-123' })} />);

      const backButton = screen.getByRole('button', { name: /volver/i });
      await user.click(backButton);

      expect(routerMocks.back).toHaveBeenCalled();
    });

    it('botón eliminar pide confirmación', async () => {
      const user = userEvent.setup();
      (global.confirm as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

      render(<EmpleadoDetailPage params={Promise.resolve({ id: 'emp-123' })} />);

      const deleteButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(deleteButton);

      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('Juan')
      );
      expect(empleadosMocks.mutateAsync).not.toHaveBeenCalled();
    });

    it('elimina empleado tras confirmación', async () => {
      const user = userEvent.setup();
      (global.confirm as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
      empleadosMocks.mutateAsync.mockResolvedValue(undefined);

      render(<EmpleadoDetailPage params={Promise.resolve({ id: 'emp-123' })} />);

      const deleteButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(empleadosMocks.mutateAsync).toHaveBeenCalledWith('emp-123');
        expect(toastMocks.success).toHaveBeenCalledWith('Empleado eliminado correctamente');
        expect(routerMocks.push).toHaveBeenCalledWith('/admin/empleados');
      });
    });

    it('muestra error al fallar eliminación', async () => {
      const user = userEvent.setup();
      (global.confirm as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
      empleadosMocks.mutateAsync.mockRejectedValue(new Error('Database error'));

      render(<EmpleadoDetailPage params={Promise.resolve({ id: 'emp-123' })} />);

      const deleteButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(toastMocks.error).toHaveBeenCalledWith('Error al eliminar empleado');
      });
    });
  });
});
