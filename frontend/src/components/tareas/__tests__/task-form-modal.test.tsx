import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskFormModal } from '../task-form-modal';

const tareasMocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
}));

const empleadosMocks = vi.hoisted(() => ({
  data: {
    data: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        nombre: 'Ana',
        apellidos: 'Lopez',
      },
    ],
  },
}));

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/hooks/use-tareas', () => ({
  useCreateTarea: () => ({ mutateAsync: tareasMocks.create }),
  useUpdateTarea: () => ({ mutateAsync: tareasMocks.update }),
}));

vi.mock('@/hooks/use-empleados', () => ({
  useEmpleados: () => ({ data: empleadosMocks.data }),
}));

vi.mock('sonner', () => ({
  toast: toastMocks,
}));

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
  const Ctx = ReactModule.createContext<(value: string) => void>(() => undefined);

  return {
    Select: ({ children, onValueChange }: { children: React.ReactNode; onValueChange?: (value: string) => void }) => (
      <Ctx.Provider value={onValueChange || (() => undefined)}>{children}</Ctx.Provider>
    ),
    SelectTrigger: ({ children, id }: { children: React.ReactNode; id?: string }) => {
      const set = ReactModule.useContext(Ctx);
      return (
        <button
          type="button"
          onClick={() =>
            set(id === 'usuarioAsignadoId' ? '11111111-1111-1111-1111-111111111111' : 'HIGH')
          }
        >
          {children}
        </button>
      );
    },
    SelectValue: ({ placeholder }: { placeholder: string }) => <span>{placeholder}</span>,
    SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

describe('TaskFormModal', () => {
  beforeEach(() => {
    tareasMocks.create.mockReset();
    tareasMocks.update.mockReset();
    toastMocks.success.mockReset();
    toastMocks.error.mockReset();
  });

  it('crea tarea en modo nuevo', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    tareasMocks.create.mockResolvedValue({ id: 't-1' });

    render(
      <TaskFormModal open={true} onOpenChange={onOpenChange} proyectoId="p-1" />
    );

    await user.type(screen.getByLabelText(/título/i), 'Nueva tarea crítica');
    await user.click(screen.getByRole('button', { name: /seleccionar usuario/i }));
    await user.type(screen.getByLabelText(/horas estimadas/i), '2');
    await user.click(screen.getByRole('button', { name: /crear tarea/i }));

    await waitFor(() => {
      expect(tareasMocks.create).toHaveBeenCalled();
      expect(toastMocks.success).toHaveBeenCalledWith('Tarea creada correctamente');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('actualiza tarea en modo edición', async () => {
    const user = userEvent.setup();

    tareasMocks.update.mockResolvedValue({ id: 't-1' });

    render(
      <TaskFormModal
        open={true}
        onOpenChange={vi.fn()}
        proyectoId="p-1"
        tarea={{
          id: 't-1',
          titulo: 'Tarea existente',
          prioridad: 'MEDIUM',
          estado: 'TODO',
          proyectoId: 'p-1',
          usuarioAsignadoId: '11111111-1111-1111-1111-111111111111',
          horasEstimadas: '3',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        } as never}
      />
    );

    const input = screen.getByLabelText(/título/i);
    await user.clear(input);
    await user.type(input, 'Tarea editada');
    await user.type(screen.getByLabelText(/horas estimadas/i), '4');
    await user.click(screen.getByRole('button', { name: /actualizar/i }));

    await waitFor(() => {
      expect(tareasMocks.update).toHaveBeenCalled();
      expect(toastMocks.success).toHaveBeenCalledWith('Tarea actualizada correctamente');
    });
  });

  it('muestra error toast cuando falla mutate', async () => {
    const user = userEvent.setup();
    tareasMocks.create.mockRejectedValue(new Error('boom'));

    render(
      <TaskFormModal open={true} onOpenChange={vi.fn()} proyectoId="p-1" />
    );

    await user.type(screen.getByLabelText(/título/i), 'Nueva tarea');
    await user.click(screen.getByRole('button', { name: /seleccionar usuario/i }));
    await user.type(screen.getByLabelText(/horas estimadas/i), '2');
    await user.click(screen.getByRole('button', { name: /crear tarea/i }));

    await waitFor(() => {
      expect(toastMocks.error).toHaveBeenCalledWith('Error al crear la tarea');
    });
  });
});
