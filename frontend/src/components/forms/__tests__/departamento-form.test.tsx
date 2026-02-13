import React from 'react';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DepartamentoForm } from '../departamento-form';

const depMocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  useDepartamento: vi.fn(),
}));

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/hooks/use-departamentos', () => ({
  useCreateDepartamento: () => ({ mutateAsync: depMocks.create, isPending: false }),
  useUpdateDepartamento: () => ({ mutateAsync: depMocks.update, isPending: false }),
  useDepartamento: (...args: unknown[]) => (depMocks.useDepartamento as Mock)(...args),
}));

vi.mock('@/hooks/use-empleados', () => ({
  useEmpleados: () => ({
    data: {
      data: [{ id: '11111111-1111-1111-1111-111111111111', nombre: 'Ana', apellidos: 'Lopez', rol: 'MANAGER' }],
    },
  }),
}));

vi.mock('sonner', () => ({ toast: toastMocks }));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

vi.mock('@/components/ui/select', async () => {
  const ReactModule = await import('react');
  const Ctx = ReactModule.createContext<(v: string) => void>(() => undefined);
  return {
    Select: ({ children, onValueChange }: { children: React.ReactNode; onValueChange?: (v: string) => void }) => (
      <Ctx.Provider value={onValueChange || (() => undefined)}>{children}</Ctx.Provider>
    ),
    SelectTrigger: ({ children }: { children: React.ReactNode }) => {
      const set = ReactModule.useContext(Ctx);
      return <button type="button" aria-label="Seleccionar responsable" onClick={() => set('11111111-1111-1111-1111-111111111111')}>{children}</button>;
    },
    SelectValue: ({ placeholder }: { placeholder: string }) => <span>{placeholder}</span>,
    SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

describe('DepartamentoForm', () => {
  beforeEach(() => {
    depMocks.create.mockReset();
    depMocks.update.mockReset();
    depMocks.useDepartamento.mockReset();
    depMocks.useDepartamento.mockReturnValue({ data: undefined, isLoading: false });
    toastMocks.success.mockReset();
    toastMocks.error.mockReset();
  });

  it('crea departamento', async () => {
    const user = userEvent.setup();
    depMocks.create.mockResolvedValue({ id: 'd-1' });

    render(<DepartamentoForm open={true} onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText(/^nombre/i), 'Tecnología');
    await user.type(screen.getByLabelText(/^código/i), 'it');
    await user.click(screen.getByRole('button', { name: /crear$/i }));

    await waitFor(() => {
      expect(depMocks.create).toHaveBeenCalled();
      expect(toastMocks.success).toHaveBeenCalledWith('Departamento creado correctamente');
    });
  });

  it('actualiza departamento en modo edición', async () => {
    const user = userEvent.setup();
    depMocks.update.mockResolvedValue({ id: 'd-1' });
    depMocks.useDepartamento.mockReturnValue({
      data: {
        id: 'd-1',
        nombre: 'IT',
        codigo: 'IT',
        descripcion: 'desc',
        responsableId: '',
        color: '#112233',
      },
      isLoading: false,
    });

    render(<DepartamentoForm open={true} onOpenChange={vi.fn()} departamentoId="d-1" />);

    const nombre = await screen.findByLabelText(/^nombre/i);
    await user.clear(nombre);
    await user.type(nombre, 'Tecnología y Datos');
    await user.click(screen.getByRole('button', { name: /actualizar/i }));

    await waitFor(() => {
      expect(depMocks.update).toHaveBeenCalled();
      expect(toastMocks.success).toHaveBeenCalledWith('Departamento actualizado correctamente');
    });
  });

  it('muestra error de API al fallar', async () => {
    const user = userEvent.setup();
    depMocks.create.mockRejectedValue({ error: 'Código ya existe' });

    render(<DepartamentoForm open={true} onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText(/^nombre/i), 'Finanzas');
    await user.type(screen.getByLabelText(/^código/i), 'FIN');
    await user.click(screen.getByRole('button', { name: /crear$/i }));

    await waitFor(() => {
      expect(toastMocks.error).toHaveBeenCalledWith('Código ya existe');
    });
  });
});
