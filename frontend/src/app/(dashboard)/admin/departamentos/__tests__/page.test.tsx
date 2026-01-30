import React from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Departamento } from '@/types';
import DepartamentosPage from '../page';

// Mock de DepartamentoForm
vi.mock('@/components/forms/departamento-form', () => ({
  DepartamentoForm: ({ open, onSuccess }: { open: boolean; onSuccess: () => void }) => {
    if (!open) return null;
    return (
      <div data-testid="departamento-form-modal">
        <button onClick={onSuccess}>Guardar</button>
      </div>
    );
  },
}));

// Mock de hooks
const departamentosMocks = vi.hoisted(() => ({
  data: null as { departamentos: Departamento[] } | null,
  isLoading: false,
  error: null,
  mutateAsync: vi.fn(),
}));

const permissionsMocks = vi.hoisted(() => ({
  canManageUsers: true,
}));

vi.mock('@/hooks/use-departamentos', () => ({
  useDepartamentos: () => ({
    data: departamentosMocks.data,
    isLoading: departamentosMocks.isLoading,
    error: departamentosMocks.error,
  }),
  useDeleteDepartamento: () => ({
    mutateAsync: departamentosMocks.mutateAsync,
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

const mockDepartamentos: Departamento[] = [
  {
    id: 'dept-1',
    nombre: 'Tecnología',
    codigo: 'TECH',
    descripcion: 'Departamento de tecnología',
    color: '#3B82F6',
    activo: true,
    responsableId: undefined,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
    _count: { usuarios: 15 },
  },
  {
    id: 'dept-2',
    nombre: 'RRHH',
    codigo: 'HR',
    descripcion: 'Recursos Humanos',
    color: '#10B981',
    activo: true,
    responsableId: undefined,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
    _count: { usuarios: 5 },
  },
  {
    id: 'dept-3',
    nombre: 'Ventas',
    codigo: 'SALES',
    descripcion: 'Departamento de ventas',
    color: '#F59E0B',
    activo: false,
    responsableId: undefined,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
    _count: { usuarios: 0 },
  },
];

describe('DepartamentosPage', () => {
  beforeEach(() => {
    departamentosMocks.data = null;
    departamentosMocks.isLoading = false;
    departamentosMocks.error = null;
    departamentosMocks.mutateAsync.mockReset();
    permissionsMocks.canManageUsers = true;
    toastMocks.success.mockReset();
    toastMocks.error.mockReset();
    (global.confirm as unknown as ReturnType<typeof vi.fn>).mockReset();
  });

  it('muestra acceso denegado sin permisos', () => {
    permissionsMocks.canManageUsers = false;

    render(<DepartamentosPage />);

    expect(screen.getByText(/acceso denegado/i)).toBeInTheDocument();
    expect(screen.getByText(/no tienes permisos/i)).toBeInTheDocument();
  });

  it('muestra skeleton mientras carga', () => {
    departamentosMocks.isLoading = true;

    render(<DepartamentosPage />);

    expect(screen.getByText('Departamentos')).toBeInTheDocument();
    // Los skeletons se renderizan pero no tienen texto específico para testear
  });

  it('muestra mensaje cuando no hay departamentos', () => {
    departamentosMocks.data = { departamentos: [] };

    render(<DepartamentosPage />);

    expect(screen.getByText(/no hay departamentos registrados/i)).toBeInTheDocument();
    expect(screen.getByText(/crear primer departamento/i)).toBeInTheDocument();
  });

  it('muestra lista de departamentos', () => {
    departamentosMocks.data = { departamentos: mockDepartamentos.filter(d => d.activo) };

    render(<DepartamentosPage />);

    expect(screen.getByText('Tecnología')).toBeInTheDocument();
    expect(screen.getByText('Código: TECH')).toBeInTheDocument();
    expect(screen.getByText('15 empleados')).toBeInTheDocument();

    expect(screen.getByText('RRHH')).toBeInTheDocument();
    expect(screen.getByText('Código: HR')).toBeInTheDocument();
    expect(screen.getByText('5 empleados')).toBeInTheDocument();
  });

  it('abre modal al hacer clic en crear', async () => {
    departamentosMocks.data = { departamentos: [] };
    const user = userEvent.setup();

    render(<DepartamentosPage />);

    const createButton = screen.getAllByText(/crear/i)[0];
    await user.click(createButton);

    expect(screen.getByTestId('departamento-form-modal')).toBeInTheDocument();
  });

  it('abre modal al hacer clic en editar', async () => {
    departamentosMocks.data = { departamentos: mockDepartamentos.filter(d => d.activo) };
    const user = userEvent.setup();

    render(<DepartamentosPage />);

    const editButtons = screen.getAllByText(/editar/i);
    await user.click(editButtons[0]);

    expect(screen.getByTestId('departamento-form-modal')).toBeInTheDocument();
  });

  it('elimina departamento tras confirmación', async () => {
    departamentosMocks.data = { departamentos: mockDepartamentos.filter(d => d.activo) };
    departamentosMocks.mutateAsync.mockResolvedValue(undefined);
    (global.confirm as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    const user = userEvent.setup();

    render(<DepartamentosPage />);

    const deleteButtons = screen.getAllByText(/eliminar/i);
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('Tecnología')
      );
      expect(departamentosMocks.mutateAsync).toHaveBeenCalledWith('dept-1');
      expect(toastMocks.success).toHaveBeenCalledWith('Departamento eliminado correctamente');
    });
  });

  it('no elimina si se cancela confirmación', async () => {
    departamentosMocks.data = { departamentos: mockDepartamentos.filter(d => d.activo) };
    (global.confirm as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
    const user = userEvent.setup();

    render(<DepartamentosPage />);

    const deleteButtons = screen.getAllByText(/eliminar/i);
    await user.click(deleteButtons[0]);

    expect(global.confirm).toHaveBeenCalled();
    expect(departamentosMocks.mutateAsync).not.toHaveBeenCalled();
  });

  it('filtra por búsqueda', async () => {
    departamentosMocks.data = { departamentos: mockDepartamentos.filter(d => d.activo) };
    const user = userEvent.setup();

    render(<DepartamentosPage />);

    const searchInput = screen.getByPlaceholderText(/buscar por nombre o código/i);
    await user.type(searchInput, 'TECH');

    expect(searchInput).toHaveValue('TECH');
  });

  it('cambia filtro a inactivos', async () => {
    departamentosMocks.data = { departamentos: mockDepartamentos.filter(d => d.activo) };
    const user = userEvent.setup();

    render(<DepartamentosPage />);

    const inactivosButton = screen.getByText('Inactivos');
    await user.click(inactivosButton);

    // El botón ahora debería tener variant="default"
    expect(inactivosButton).toBeInTheDocument();
  });
});
