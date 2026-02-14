import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskList } from '../task-list';

const tareasMocks = vi.hoisted(() => ({
  updateEstado: vi.fn(),
  reasignar: vi.fn(),
  eliminar: vi.fn(),
}));

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/hooks/use-tareas', () => ({
  useUpdateEstadoTarea: () => ({ mutateAsync: tareasMocks.updateEstado }),
  useReasignarTarea: () => ({ mutateAsync: tareasMocks.reasignar }),
  useDeleteTarea: () => ({ mutateAsync: tareasMocks.eliminar, isPending: false }),
}));

vi.mock('@/hooks/use-empleados', () => ({
  useEmpleados: () => ({
    data: {
      data: [{ id: 'u-2', nombre: 'Luis', apellidos: 'Gomez' }],
    },
  }),
}));

vi.mock('sonner', () => ({
  toast: toastMocks,
}));

vi.mock('../task-form-modal', () => ({
  TaskFormModal: ({ open, tarea }: { open: boolean; tarea?: { id: string } }) =>
    open ? <div data-testid="task-form-modal">{tarea ? `edit:${tarea.id}` : 'create'}</div> : null,
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick, className }: { children: React.ReactNode; onClick?: (e: React.MouseEvent) => void; className?: string }) => (
    <button type="button" className={className} onClick={(e) => onClick?.(e)}>{children}</button>
  ),
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

vi.mock('@/components/ui/select', async () => {
  const ReactModule = await import('react');
  const Ctx = ReactModule.createContext<(value: string) => void>(() => undefined);

  return {
    Select: ({ children, onValueChange }: { children: React.ReactNode; onValueChange?: (value: string) => void }) => (
      <Ctx.Provider value={onValueChange || (() => undefined)}>{children}</Ctx.Provider>
    ),
    SelectTrigger: ({ children }: { children: React.ReactNode }) => {
      const set = ReactModule.useContext(Ctx);
      return <button type="button" onClick={() => set('u-2')}>{children}</button>;
    },
    SelectValue: ({ placeholder }: { placeholder: string }) => <span>{placeholder}</span>,
    SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

const tareas = [
  {
    id: 't-1',
    titulo: 'Diseñar API',
    estado: 'TODO',
    prioridad: 'HIGH',
    proyectoId: 'p-1',
    usuarioAsignadoId: 'u-1',
    usuarioAsignado: { id: 'u-1', nombre: 'Ana', apellidos: 'Lopez' },
    fechaInicio: '2026-01-10',
    fechaFin: '2026-01-15',
    horasEstimadas: '8',
    horasReales: '4',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

describe('TaskList', () => {
  beforeEach(() => {
    tareasMocks.updateEstado.mockReset();
    tareasMocks.reasignar.mockReset();
    tareasMocks.eliminar.mockReset();
    toastMocks.success.mockReset();
    toastMocks.error.mockReset();
  });

  it('renderiza loading y estado vacío', () => {
    const { rerender, container } = render(
      <TaskList proyectoId="p-1" tareas={[]} isLoading />
    );

    expect(container.querySelectorAll('[class*="animate-pulse"]').length).toBeGreaterThan(0);

    rerender(<TaskList proyectoId="p-1" tareas={[]} isLoading={false} />);
    expect(screen.getByText(/no hay tareas/i)).toBeInTheDocument();
  });

  it('abre modal de crear y editar desde fila', async () => {
    const user = userEvent.setup();

    render(<TaskList proyectoId="p-1" tareas={tareas as never[]} />);

    await user.click(screen.getByRole('button', { name: /nueva tarea/i }));
    expect(screen.getByTestId('task-form-modal')).toHaveTextContent('create');

    await user.click(screen.getByText('Diseñar API'));
    expect(screen.getByTestId('task-form-modal')).toHaveTextContent('edit:t-1');
  });

  it('cambia estado, reasigna y elimina tarea', async () => {
    const user = userEvent.setup();

    tareasMocks.updateEstado.mockResolvedValue({});
    tareasMocks.reasignar.mockResolvedValue({});
    tareasMocks.eliminar.mockResolvedValue({});

    render(<TaskList proyectoId="p-1" tareas={tareas as never[]} />);

    await user.click(screen.getByRole('button', { name: /en progreso/i }));
    await waitFor(() => {
      expect(tareasMocks.updateEstado).toHaveBeenCalled();
      expect(toastMocks.success).toHaveBeenCalledWith('Estado actualizado');
    });

    await user.click(screen.getByRole('button', { name: /reasignar/i }));
    await user.click(screen.getByRole('button', { name: /seleccionar usuario/i }));
    await user.click(screen.getAllByRole('button', { name: /reasignar/i })[1]);

    await waitFor(() => {
      expect(tareasMocks.reasignar).toHaveBeenCalledWith({ id: 't-1', usuarioAsignadoId: 'u-2' });
    });

    await user.click(screen.getByRole('button', { name: /eliminar/i }));
    await user.click(screen.getAllByRole('button', { name: /^eliminar$/i })[1]);

    await waitFor(() => {
      expect(tareasMocks.eliminar).toHaveBeenCalledWith('t-1');
      expect(toastMocks.success).toHaveBeenCalledWith('Tarea eliminada');
    });
  });
});
