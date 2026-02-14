import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProcesoDetailPage from '../page';

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    use: (value: unknown) => value,
  };
});

const routerMocks = vi.hoisted(() => ({ push: vi.fn() }));
const permisosMocks = vi.hoisted(() => ({ canCreateOnboarding: true }));
const procesoMocks = vi.hoisted(() => ({ data: undefined as unknown, isLoading: false, error: null as unknown }));
const mutMocks = vi.hoisted(() => ({
  pausar: vi.fn(),
  reanudar: vi.fn(),
  cancelar: vi.fn(),
  completar: vi.fn(),
}));
const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => routerMocks }));
vi.mock('@/hooks/use-permissions', () => ({ usePermissions: () => permisosMocks }));
vi.mock('@/hooks/use-procesos', () => ({
  useProceso: () => procesoMocks,
  usePausarProceso: () => ({ mutateAsync: mutMocks.pausar, isPending: false }),
  useReanudarProceso: () => ({ mutateAsync: mutMocks.reanudar, isPending: false }),
  useCancelarProceso: () => ({ mutateAsync: mutMocks.cancelar, isPending: false }),
  useCompletarTarea: () => ({ mutateAsync: mutMocks.completar, isPending: false }),
}));
vi.mock('sonner', () => ({ toast: toastMocks }));

describe('Onboarding/[id] page', () => {
  beforeEach(() => {
    routerMocks.push.mockReset();
    Object.values(mutMocks).forEach((m) => m.mockReset());
    toastMocks.success.mockReset();
    toastMocks.error.mockReset();
    procesoMocks.isLoading = false;
    procesoMocks.error = null;
    procesoMocks.data = undefined;
    permisosMocks.canCreateOnboarding = true;
    vi.stubGlobal('confirm', vi.fn(() => true));
    vi.stubGlobal('prompt', vi.fn(() => 'nota de test'));
  });

  it('muestra loading y error', () => {
    const { rerender } = render(<ProcesoDetailPage params={{ id: 'proc-1' } as never} />);

    procesoMocks.isLoading = true;
    rerender(<ProcesoDetailPage params={{ id: 'proc-1' } as never} />);
    expect(document.querySelectorAll('[class*="skeleton"], [class*="animate-pulse"]').length).toBeGreaterThan(0);

    procesoMocks.isLoading = false;
    procesoMocks.error = new Error('boom');
    rerender(<ProcesoDetailPage params={{ id: 'proc-1' } as never} />);
    expect(screen.getByText(/error al cargar proceso/i)).toBeInTheDocument();
  });

  it('permite pausar, cancelar y completar tarea', async () => {
    const user = userEvent.setup();
    mutMocks.pausar.mockResolvedValue({});
    mutMocks.cancelar.mockResolvedValue({});
    mutMocks.completar.mockResolvedValue({});

    procesoMocks.data = {
      id: 'proc-1',
      empleadoNombre: 'Ana Lopez',
      plantillaNombre: 'Onboarding Base',
      estado: 'EN_CURSO',
      progreso: '0.5',
      fechaInicio: '2026-01-10',
      tareas: [
        { id: 't1', titulo: 'Leer política', estado: 'PENDIENTE', categoria: 'DOC', prioridad: 'ALTA' },
      ],
    };

    render(<ProcesoDetailPage params={{ id: 'proc-1' } as never} />);

    await user.click(screen.getByRole('button', { name: /pausar proceso/i }));
    await user.click(screen.getByRole('button', { name: /cancelar proceso/i }));
    await user.click(screen.getByRole('button', { name: /completar/i }));

    await waitFor(() => {
      expect(mutMocks.pausar).toHaveBeenCalledWith('proc-1');
      expect(mutMocks.cancelar).toHaveBeenCalled();
      expect(mutMocks.completar).toHaveBeenCalled();
      expect(toastMocks.success).toHaveBeenCalled();
    });
  });

  it('permite reanudar cuando está pausado', async () => {
    const user = userEvent.setup();
    mutMocks.reanudar.mockResolvedValue({});

    procesoMocks.data = {
      id: 'proc-2',
      empleadoNombre: 'Ana Lopez',
      plantillaNombre: 'Onboarding Base',
      estado: 'PAUSADO',
      progreso: '0.2',
      fechaInicio: '2026-01-10',
      tareas: [],
    };

    render(<ProcesoDetailPage params={{ id: 'proc-2' } as never} />);

    await user.click(screen.getByRole('button', { name: /reanudar proceso/i }));

    await waitFor(() => {
      expect(mutMocks.reanudar).toHaveBeenCalledWith('proc-2');
    });
  });
});
