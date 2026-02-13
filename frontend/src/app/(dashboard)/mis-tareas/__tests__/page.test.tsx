import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MisTareasPage from '../page';

const routerMocks = vi.hoisted(() => ({ push: vi.fn() }));
const dataMocks = vi.hoisted(() => ({ data: undefined as unknown, isLoading: false, error: null as unknown }));
const completarMock = vi.hoisted(() => ({ mutateAsync: vi.fn(), isPending: false }));
const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => routerMocks }));
vi.mock('@/hooks/use-procesos', () => ({
  useMisTareas: () => dataMocks,
  useCompletarTarea: () => completarMock,
}));
vi.mock('sonner', () => ({ toast: toastMocks }));

describe('MisTareasPage', () => {
  beforeEach(() => {
    routerMocks.push.mockReset();
    completarMock.mutateAsync.mockReset();
    toastMocks.success.mockReset();
    toastMocks.error.mockReset();
    dataMocks.isLoading = false;
    dataMocks.error = null;
    dataMocks.data = { data: [] };
  });

  it('renderiza loading y error', () => {
    const { rerender } = render(<MisTareasPage />);

    dataMocks.isLoading = true;
    rerender(<MisTareasPage />);
    expect(document.querySelectorAll('[class*="skeleton"], [class*="animate-pulse"]').length).toBeGreaterThan(0);

    dataMocks.isLoading = false;
    dataMocks.error = new Error('boom');
    rerender(<MisTareasPage />);
    expect(screen.getByText(/no se pudieron cargar las tareas/i)).toBeInTheDocument();
  });

  it('filtra y completa tarea', async () => {
    const user = userEvent.setup();
    completarMock.mutateAsync.mockResolvedValue({});

    dataMocks.data = {
      data: [
        { id: 't1', procesoId: 'p1', titulo: 'Configurar equipo', estado: 'PENDIENTE', prioridad: 'URGENTE', orden: 1, categoria: 'IT' },
        { id: 't2', procesoId: 'p2', titulo: 'Reunión de bienvenida', estado: 'COMPLETADA', prioridad: 'BAJA', orden: 2 },
      ],
    };

    render(<MisTareasPage />);

    await user.type(screen.getByPlaceholderText(/buscar tareas/i), 'configurar');
    expect(screen.getByText(/configurar equipo/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /completar/i }));
    await user.type(screen.getByPlaceholderText(/añade notas/i), 'hecho');
    await user.click(screen.getByRole('button', { name: /completar tarea/i }));

    await waitFor(() => {
      expect(completarMock.mutateAsync).toHaveBeenCalled();
      expect(toastMocks.success).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: /ver proceso/i }));
    expect(routerMocks.push).toHaveBeenCalledWith('/onboarding/p1');
  });
});
