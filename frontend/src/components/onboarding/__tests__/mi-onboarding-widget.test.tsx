import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MiOnboardingWidget } from '../mi-onboarding-widget';

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  user: { id: 'u-1' },
}));

const procesosMocks = vi.hoisted(() => ({
  data: undefined as unknown,
  isLoading: false,
}));

const tareasMocks = vi.hoisted(() => ({
  data: undefined as unknown,
  isLoading: false,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerMocks.push }),
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: authMocks.user }),
}));

vi.mock('@/hooks/use-procesos', () => ({
  useProcesos: () => ({ data: procesosMocks.data, isLoading: procesosMocks.isLoading }),
  useMisTareas: () => ({ data: tareasMocks.data, isLoading: tareasMocks.isLoading }),
}));

describe('MiOnboardingWidget', () => {
  beforeEach(() => {
    routerMocks.push.mockReset();
    procesosMocks.data = undefined;
    procesosMocks.isLoading = false;
    tareasMocks.data = undefined;
    tareasMocks.isLoading = false;
  });

  it('muestra skeleton en loading', () => {
    procesosMocks.isLoading = true;
    tareasMocks.isLoading = true;

    const { container } = render(<MiOnboardingWidget />);
    expect(container.querySelectorAll('[class*="animate-pulse"], [class*="skeleton"]').length).toBeGreaterThan(0);
  });

  it('muestra estado sin proceso', () => {
    procesosMocks.data = { data: [] };
    tareasMocks.data = { data: [] };

    render(<MiOnboardingWidget />);

    expect(screen.getByText(/no tienes un proceso de onboarding activo/i)).toBeInTheDocument();
  });

  it('muestra progreso, tareas pendientes y navega a detalle/mis tareas', async () => {
    const user = userEvent.setup();

    procesosMocks.data = {
      data: [
        {
          id: 'p-1',
          plantillaNombre: 'Plantilla Base',
          estado: 'EN_CURSO',
          progreso: '2/4',
          fechaInicio: '2026-01-01',
          fechaFinEsperada: '2026-01-15',
        },
      ],
    };
    tareasMocks.data = {
      data: [
        { id: 't-1', titulo: 'Leer documentación', categoria: 'Lectura', estado: 'PENDIENTE', orden: 1, prioridad: 'URGENTE' },
        { id: 't-2', titulo: 'Instalar herramientas', categoria: 'Setup', estado: 'PENDIENTE', orden: 2, prioridad: 'MEDIA' },
      ],
    };

    render(<MiOnboardingWidget />);

    expect(screen.getByText('Plantilla Base')).toBeInTheDocument();
    expect(screen.getByText('2/4')).toBeInTheDocument();
    expect(screen.getByText('Urgente')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /ver detalle/i }));
    await user.click(screen.getByRole('button', { name: /mis tareas/i }));

    expect(routerMocks.push).toHaveBeenCalledWith('/onboarding/p-1');
    expect(routerMocks.push).toHaveBeenCalledWith('/mis-tareas');
  });

  it('muestra estados completado y pausado', () => {
    procesosMocks.data = {
      data: [
        {
          id: 'p-2',
          plantillaNombre: 'Plantilla',
          estado: 'COMPLETADO',
          progreso: '4/4',
          fechaInicio: '2026-01-01',
        },
      ],
    };
    tareasMocks.data = { data: [] };

    const { rerender } = render(<MiOnboardingWidget />);
    expect(screen.getByText(/onboarding completado/i)).toBeInTheDocument();

    procesosMocks.data = {
      data: [
        {
          id: 'p-3',
          plantillaNombre: 'Plantilla',
          estado: 'PAUSADO',
          progreso: '1/4',
          fechaInicio: '2026-01-01',
        },
      ],
    };
    rerender(<MiOnboardingWidget />);

    expect(screen.getByText(/está pausado temporalmente/i)).toBeInTheDocument();
  });
});
