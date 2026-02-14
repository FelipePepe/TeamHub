import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProyectoForm } from '../proyecto-form';

const proyectoMocks = vi.hoisted(() => ({
  create: vi.fn(),
}));

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/hooks/use-proyectos', () => ({
  useCreateProyecto: () => ({ mutateAsync: proyectoMocks.create, isPending: false }),
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
      return <button type="button" onClick={() => set('ALTA')}>{children}</button>;
    },
    SelectValue: ({ placeholder }: { placeholder: string }) => <span>{placeholder}</span>,
    SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

describe('ProyectoForm', () => {
  beforeEach(() => {
    proyectoMocks.create.mockReset();
    toastMocks.success.mockReset();
    toastMocks.error.mockReset();
  });

  it('crea proyecto correctamente', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onSuccess = vi.fn();

    proyectoMocks.create.mockResolvedValue({ id: 'p-1' });

    render(<ProyectoForm open={true} onOpenChange={onOpenChange} onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/^nombre/i), 'Proyecto Atlas');
    await user.type(screen.getByLabelText(/^código/i), 'atl-01');
    await user.click(screen.getByRole('button', { name: /crear proyecto/i }));

    await waitFor(() => {
      expect(proyectoMocks.create).toHaveBeenCalled();
      expect(toastMocks.success).toHaveBeenCalledWith('Proyecto creado correctamente');
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('muestra error cuando la API falla', async () => {
    const user = userEvent.setup();
    proyectoMocks.create.mockRejectedValue({ error: 'Código duplicado' });

    render(<ProyectoForm open={true} onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText(/^nombre/i), 'Proyecto Atlas');
    await user.type(screen.getByLabelText(/^código/i), 'atl-01');
    await user.click(screen.getByRole('button', { name: /crear proyecto/i }));

    await waitFor(() => {
      expect(toastMocks.error).toHaveBeenCalledWith('Código duplicado');
    });
  });
});
