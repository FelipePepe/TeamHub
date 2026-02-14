import React from 'react';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditarPlantillaPage from '../page';

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    use: (value: unknown) => value,
  };
});

const routerMocks = vi.hoisted(() => ({ push: vi.fn() }));
const permsMocks = vi.hoisted(() => ({ canManageTemplates: true }));
const dataMocks = vi.hoisted(() => ({
  plantilla: { data: undefined as unknown, isLoading: false },
  tareas: { data: { tareas: [] } as unknown, isLoading: false },
  departamentos: { data: { data: [] } as unknown },
}));
const mutMocks = vi.hoisted(() => ({
  updatePlantilla: vi.fn(),
  createTarea: vi.fn(),
  updateTarea: vi.fn(),
  deleteTarea: vi.fn(),
}));
const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => routerMocks }));
vi.mock('@/hooks/use-permissions', () => ({ usePermissions: () => permsMocks }));
vi.mock('@/hooks/use-plantillas', () => ({
  usePlantilla: () => dataMocks.plantilla,
  useTareasPlantilla: () => dataMocks.tareas,
  useUpdatePlantilla: () => ({ mutateAsync: mutMocks.updatePlantilla, isPending: false }),
  useCreateTareaPlantilla: () => ({ mutateAsync: mutMocks.createTarea, isPending: false }),
  useUpdateTareaPlantilla: () => ({ mutateAsync: mutMocks.updateTarea, isPending: false }),
  useDeleteTareaPlantilla: () => ({ mutateAsync: mutMocks.deleteTarea, isPending: false }),
}));
vi.mock('@/hooks/use-departamentos', () => ({ useDepartamentos: () => dataMocks.departamentos }));
vi.mock('sonner', () => ({ toast: toastMocks }));

vi.mock('@/components/ui/select', async () => {
  const ReactModule = await import('react');
  const Ctx = ReactModule.createContext<(v: string) => void>(() => undefined);
  return {
    Select: ({ children, onValueChange }: { children: React.ReactNode; onValueChange?: (v: string) => void }) => (
      <Ctx.Provider value={onValueChange || (() => undefined)}>{children}</Ctx.Provider>
    ),
    SelectTrigger: ({ children }: { children: React.ReactNode }) => {
      const set = ReactModule.useContext(Ctx);
      return <button type="button" onClick={() => set('DOCUMENTACION')}>{children}</button>;
    },
    SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder || 'value'}</span>,
    SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

describe('Admin plantillas/[id] page', () => {
  beforeEach(() => {
    routerMocks.push.mockReset();
    permsMocks.canManageTemplates = true;
    dataMocks.plantilla = { data: undefined, isLoading: false };
    dataMocks.tareas = { data: { tareas: [] }, isLoading: false };
    dataMocks.departamentos = { data: { data: [{ id: 'd1', nombre: 'IT' }] } };
    Object.values(mutMocks).forEach((m) => m.mockReset());
    toastMocks.success.mockReset();
    toastMocks.error.mockReset();
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  it('renderiza acceso denegado, loading y not found', () => {
    const { rerender } = render(<EditarPlantillaPage params={{ id: 'pl1' } as never} />);

    permsMocks.canManageTemplates = false;
    rerender(<EditarPlantillaPage params={{ id: 'pl1' } as never} />);
    expect(screen.getByText(/acceso denegado/i)).toBeInTheDocument();

    permsMocks.canManageTemplates = true;
    dataMocks.plantilla = { data: undefined, isLoading: true };
    rerender(<EditarPlantillaPage params={{ id: 'pl1' } as never} />);
    expect(document.querySelectorAll('[class*="skeleton"], [class*="animate-pulse"]').length).toBeGreaterThan(0);

    dataMocks.plantilla = { data: undefined, isLoading: false };
    rerender(<EditarPlantillaPage params={{ id: 'pl1' } as never} />);
    expect(screen.getByText(/plantilla no encontrada/i)).toBeInTheDocument();
  });

  it('edita plantilla y gestiona tareas', async () => {
    const user = userEvent.setup();
    mutMocks.updatePlantilla.mockResolvedValue({});
    mutMocks.createTarea.mockResolvedValue({});
    mutMocks.updateTarea.mockResolvedValue({});
    mutMocks.deleteTarea.mockResolvedValue({});

    dataMocks.plantilla = {
      data: { id: 'pl1', nombre: 'Plantilla Base', descripcion: 'desc', rolDestino: 'EMPLEADO', duracionEstimadaDias: 20 },
      isLoading: false,
    };
    dataMocks.tareas = {
      data: {
        tareas: [
          {
            id: 't1', titulo: 'Completar docs', orden: 1, categoria: 'DOCUMENTACION', responsable: 'RRHH', esOpcional: false, requiereAprobacion: false,
          },
        ],
      },
      isLoading: false,
    };

    render(<EditarPlantillaPage params={{ id: 'pl1' } as never} />);

    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));
    await user.click(screen.getByRole('button', { name: /añadir tarea/i }));
    await user.type(screen.getByLabelText(/título/i), 'Nueva tarea onboarding');
    await user.click(screen.getByRole('button', { name: /^añadir$/i }));

    const iconButtons = document.querySelectorAll('button.h-7.w-7');
    if (iconButtons[0] instanceof HTMLButtonElement) {
      await user.click(iconButtons[0]);
    }
    if (iconButtons[1] instanceof HTMLButtonElement) {
      await user.click(iconButtons[1]);
    }

    await waitFor(() => {
      expect(mutMocks.updatePlantilla).toHaveBeenCalled();
      expect(mutMocks.createTarea).toHaveBeenCalled();
      expect(mutMocks.deleteTarea).toHaveBeenCalled();
      expect(toastMocks.success).toHaveBeenCalled();
    });
  });
});
