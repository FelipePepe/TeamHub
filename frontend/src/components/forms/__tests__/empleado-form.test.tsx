import React from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { EmpleadoForm } from '../empleado-form';
import type { User } from '@/types';

// Mock del componente Select (evita dependencia de @radix-ui/react-select)
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: { children: React.ReactNode; value: string; onValueChange: (value: string) => void }) => (
    <div data-testid="select-mock">
      <button onClick={() => onValueChange('EMPLEADO')}>{value || 'Select'}</button>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => <option value={value}>{children}</option>,
}));

// Mock de TanStack Query
const queryClientMock = {
  invalidateQueries: vi.fn(),
};

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => queryClientMock,
}));

// Mock de hooks
const empleadosMocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
}));

const departamentosMocks = vi.hoisted(() => ({
  data: {
    data: [
      { id: 'dept-1', nombre: 'Ingeniería', activo: true },
      { id: 'dept-2', nombre: 'Marketing', activo: true },
    ],
  },
}));

vi.mock('@/hooks/use-empleados', () => ({
  useCreateEmpleado: () => empleadosMocks,
  useUpdateEmpleado: () => empleadosMocks,
}));

vi.mock('@/hooks/use-departamentos', () => ({
  useDepartamentos: () => departamentosMocks,
}));

// Mock de toast
const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: toastMocks,
}));

describe('EmpleadoForm', () => {
  beforeEach(() => {
    empleadosMocks.mutateAsync.mockReset();
    toastMocks.success.mockReset();
    toastMocks.error.mockReset();
    queryClientMock.invalidateQueries.mockReset();
  });

  describe('Modo crear', () => {
    it('renderiza formulario vacío en modo crear', async () => {
      render(
        <EmpleadoForm
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Crear nuevo empleado')).toBeInTheDocument();
      });
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^nombre/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/apellidos/i)).toBeInTheDocument();
    });

    it('muestra botón crear empleado', async () => {
      render(
        <EmpleadoForm
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /crear empleado/i });
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Modo editar', () => {
    const mockEmpleado: User = {
      id: 'emp-1',
      email: 'existente@example.com',
      nombre: 'María',
      apellidos: 'García López',
      rol: 'MANAGER',
      departamentoId: 'dept-1',
      managerId: null,
      telefono: '+34 600 123 456',
      fechaNacimiento: '1990-05-15',
      activo: true,
      bloqueado: false,
      intentosFallidos: 0,
      mfaActivo: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    it('renderiza formulario con título editar', async () => {
      render(
        <EmpleadoForm
          open={true}
          onOpenChange={vi.fn()}
          empleado={mockEmpleado}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Editar empleado')).toBeInTheDocument();
      });
    });

    it('muestra botón guardar cambios', async () => {
      render(
        <EmpleadoForm
          open={true}
          onOpenChange={vi.fn()}
          empleado={mockEmpleado}
        />
      );

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /guardar cambios/i });
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Validaciones', () => {
    it('muestra campos requeridos con asterisco', async () => {
      render(
        <EmpleadoForm
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      await waitFor(() => {
        const asterisks = screen.getAllByText('*');
        expect(asterisks.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Integración con departamentos', () => {
    it('muestra selector de departamentos', () => {
      render(
        <EmpleadoForm
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      // Verificar que existe un label con texto Departamento
      const labels = screen.getAllByText(/departamento/i);
      expect(labels.length).toBeGreaterThan(0);
    });
  });

  describe('Botón cancelar', () => {
    it('muestra botón cancelar', async () => {
      render(
        <EmpleadoForm
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancelar/i });
        expect(cancelButton).toBeInTheDocument();
      });
    });
  });
});
