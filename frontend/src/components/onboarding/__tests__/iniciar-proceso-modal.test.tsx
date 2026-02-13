import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IniciarProcesoModal } from '../iniciar-proceso-modal';

const procesoMocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  isPending: false,
}));

const plantillasMocks = vi.hoisted(() => ({
  data: {
    plantillas: [
      {
        id: 'plant-1',
        nombre: 'Plantilla Base',
        descripcion: 'Descripción base',
        departamentoNombre: 'IT',
        totalTareas: 3,
        duracionEstimadaDias: 10,
      },
    ],
  },
  isLoading: false,
}));

const empleadosMocks = vi.hoisted(() => ({
  data: {
    data: [
      {
        id: 'emp-1',
        nombre: 'Ana',
        apellidos: 'Lopez',
        departamentoNombre: 'IT',
      },
    ],
  },
  isLoading: false,
}));

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/hooks/use-procesos', () => ({
  useCreateProceso: () => procesoMocks,
}));

vi.mock('@/hooks/use-plantillas', () => ({
  usePlantillas: () => ({ data: plantillasMocks.data, isLoading: plantillasMocks.isLoading }),
}));

vi.mock('@/hooks/use-empleados', () => ({
  useEmpleados: () => ({ data: empleadosMocks.data, isLoading: empleadosMocks.isLoading }),
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

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange }: { children: React.ReactNode; onValueChange?: (value: string) => void }) => (
    <div>
      <button type="button" onClick={() => onValueChange?.('plant-1')}>select-value</button>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/calendar', () => ({
  Calendar: () => <div>Calendar</div>,
}));

describe('IniciarProcesoModal', () => {
  beforeEach(() => {
    procesoMocks.mutateAsync.mockReset();
    toastMocks.success.mockReset();
    toastMocks.error.mockReset();
  });

  it('renderiza modal y datos de plantilla seleccionada', async () => {
    const user = userEvent.setup();

    render(
      <IniciarProcesoModal open={true} onOpenChange={vi.fn()} empleadoIdPrefill="emp-1" />
    );

    expect(screen.getByText(/iniciar proceso de onboarding/i)).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /select-value/i })[1]);

    expect(screen.getByText(/información de la plantilla/i)).toBeInTheDocument();
    expect(screen.getAllByText(/tareas/i).length).toBeGreaterThan(0);
  });

  it('envía formulario correctamente y ejecuta onSuccess', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onOpenChange = vi.fn();

    procesoMocks.mutateAsync.mockResolvedValue({ id: 'proc-1' });

    render(
      <IniciarProcesoModal
        open={true}
        onOpenChange={onOpenChange}
        empleadoIdPrefill="emp-1"
        onSuccess={onSuccess}
      />
    );

    await user.click(screen.getAllByRole('button', { name: /select-value/i })[1]);
    await user.click(screen.getByRole('button', { name: /iniciar proceso/i }));

    await waitFor(() => {
      expect(procesoMocks.mutateAsync).toHaveBeenCalled();
      expect(toastMocks.success).toHaveBeenCalledWith('Proceso de onboarding iniciado correctamente');
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(onSuccess).toHaveBeenCalledWith('proc-1');
    });
  });

  it('muestra toast de error cuando falla la creación', async () => {
    const user = userEvent.setup();
    procesoMocks.mutateAsync.mockRejectedValue(new Error('fail'));

    render(
      <IniciarProcesoModal open={true} onOpenChange={vi.fn()} empleadoIdPrefill="emp-1" />
    );

    await user.click(screen.getAllByRole('button', { name: /select-value/i })[1]);
    await user.click(screen.getByRole('button', { name: /iniciar proceso/i }));

    await waitFor(() => {
      expect(toastMocks.error).toHaveBeenCalledWith('Error al iniciar el proceso');
    });
  });
});
