import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimetrackingAprobacionPage from '../page';

const routerMocks = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn() }));
const permsMocks = vi.hoisted(() => ({ canApproveHours: true }));
const dataMocks = vi.hoisted(() => ({ data: undefined as unknown, isLoading: false, error: null as unknown }));
const mutMocks = vi.hoisted(() => ({ aprobar: vi.fn(), rechazar: vi.fn(), aprobarMasivo: vi.fn() }));
const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => routerMocks }));
vi.mock('@/hooks/use-permissions', () => ({ usePermissions: () => permsMocks }));
vi.mock('@/hooks/use-timetracking', () => ({
  usePendientesAprobacion: () => dataMocks,
  useAprobarTimeEntry: () => ({ mutateAsync: mutMocks.aprobar, isPending: false }),
  useRechazarTimeEntry: () => ({ mutateAsync: mutMocks.rechazar, isPending: false }),
  useAprobarMasivo: () => ({ mutateAsync: mutMocks.aprobarMasivo, isPending: false }),
}));
vi.mock('sonner', () => ({ toast: toastMocks }));

describe('Timetracking aprobacion page', () => {
  beforeEach(() => {
    routerMocks.push.mockReset();
    routerMocks.back.mockReset();
    permsMocks.canApproveHours = true;
    dataMocks.isLoading = false;
    dataMocks.error = null;
    dataMocks.data = { data: [] };
    Object.values(mutMocks).forEach((m) => m.mockReset());
    toastMocks.success.mockReset();
    toastMocks.error.mockReset();
  });

  it('muestra acceso denegado sin permisos', () => {
    permsMocks.canApproveHours = false;
    render(<TimetrackingAprobacionPage />);
    expect(screen.getByText(/acceso denegado/i)).toBeInTheDocument();
  });

  it('muestra loading/error y vacío', () => {
    const { rerender } = render(<TimetrackingAprobacionPage />);

    dataMocks.isLoading = true;
    rerender(<TimetrackingAprobacionPage />);
    expect(document.querySelectorAll('[class*="skeleton"], [class*="animate-pulse"]').length).toBeGreaterThan(0);

    dataMocks.isLoading = false;
    dataMocks.error = new Error('boom');
    rerender(<TimetrackingAprobacionPage />);
    expect(screen.getByText(/error al cargar pendientes/i)).toBeInTheDocument();
  });

  it('aprueba, rechaza y aprueba masivo', async () => {
    const user = userEvent.setup();
    mutMocks.aprobar.mockResolvedValue({});
    mutMocks.rechazar.mockResolvedValue({});
    mutMocks.aprobarMasivo.mockResolvedValue({});

    dataMocks.data = {
      data: [
        {
          usuarioId: 'u1',
          usuarioNombre: 'Ana',
          proyectoId: 'p1',
          proyectoNombre: 'Proyecto 1',
          totalHoras: 6,
          registros: [
            { id: 'r1', fecha: '2026-01-10', horas: 4, descripcion: 'trabajo' },
            { id: 'r2', fecha: '2026-01-11', horas: 2, descripcion: 'más trabajo' },
          ],
        },
      ],
    };

    render(<TimetrackingAprobacionPage />);

    const checks = screen.getAllByRole('checkbox');
    await user.click(checks[0]);
    await user.click(screen.getByRole('button', { name: /aprobar selección/i }));

    await user.click(screen.getAllByRole('button').find((b) => b.innerHTML.includes('text-green-600'))!);
    await user.click(screen.getAllByRole('button').find((b) => b.innerHTML.includes('text-red-600'))!);

    await user.type(screen.getByPlaceholderText(/motivo del rechazo/i), 'faltan detalles');
    await user.click(screen.getByRole('button', { name: /^rechazar$/i }));

    await waitFor(() => {
      expect(mutMocks.aprobarMasivo).toHaveBeenCalled();
      expect(mutMocks.aprobar).toHaveBeenCalled();
      expect(mutMocks.rechazar).toHaveBeenCalled();
    });
  });
});
