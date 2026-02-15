import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    use: (value: unknown) => value,
  };
});

const routerMocks = vi.hoisted(() => ({ push: vi.fn() }));
const permsMocks = vi.hoisted(() => ({ canManageTemplates: true }));
const paramsMocks = vi.hoisted(() => ({ id: 'pl1' }));
const dataMocks = vi.hoisted(() => ({
  plantilla: { data: undefined as unknown, isLoading: false },
  departamentos: { data: { data: [] } as unknown },
}));
const mutMocks = vi.hoisted(() => ({
  updatePlantilla: vi.fn(),
  createTarea: vi.fn(),
  updateTarea: vi.fn(),
  deleteTarea: vi.fn(),
}));
const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => routerMocks,
  useParams: () => paramsMocks,
}));
vi.mock('@/hooks/use-permissions', () => ({ usePermissions: () => permsMocks }));
vi.mock('@/hooks/use-plantillas', () => ({
  usePlantilla: () => dataMocks.plantilla,
  useUpdatePlantilla: () => ({ mutateAsync: mutMocks.updatePlantilla, isPending: false }),
  useCreateTareaPlantilla: () => ({ mutateAsync: mutMocks.createTarea, isPending: false }),
  useUpdateTareaPlantilla: () => ({ mutateAsync: mutMocks.updateTarea, isPending: false }),
  useDeleteTareaPlantilla: () => ({ mutateAsync: mutMocks.deleteTarea, isPending: false }),
  useReorderTareasPlantilla: () => ({ mutateAsync: vi.fn(), isPending: false }),
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
    SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => {
      if (!value) {
        throw new Error('SelectItem value must be a non-empty string');
      }
      return <div>{children}</div>;
    },
  };
});

describe('Admin plantillas/[id] page', () => {
  let EditarPlantillaPage: typeof import('../page').default;

  beforeEach(async () => {
    routerMocks.push.mockReset();
    permsMocks.canManageTemplates = true;
    paramsMocks.id = 'pl1';
    dataMocks.plantilla = { data: undefined, isLoading: false };
    dataMocks.departamentos = { data: { data: [{ id: 'd1', nombre: 'IT' }] } };
    Object.values(mutMocks).forEach((m) => m.mockReset());
    toastMocks.success.mockReset();
    toastMocks.error.mockReset();
    vi.stubGlobal('confirm', vi.fn(() => true));

    const mod = await import('../page');
    EditarPlantillaPage = mod.default;
  });

  it('renderiza acceso denegado, loading y not found', () => {
    const { rerender } = render(<EditarPlantillaPage />);

    permsMocks.canManageTemplates = false;
    rerender(<EditarPlantillaPage />);
    expect(screen.getByText(/acceso denegado/i)).toBeInTheDocument();

    permsMocks.canManageTemplates = true;
    dataMocks.plantilla = { data: undefined, isLoading: true };
    rerender(<EditarPlantillaPage />);
    expect(document.querySelectorAll('[class*="skeleton"], [class*="animate-pulse"]').length).toBeGreaterThan(0);

    dataMocks.plantilla = { data: undefined, isLoading: false };
    rerender(<EditarPlantillaPage />);
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
    (dataMocks.plantilla.data as { tareas?: unknown[] }).tareas = [
      {
        id: 't1',
        plantillaId: 'pl1',
        titulo: 'Completar docs',
        orden: 1,
        categoria: 'DOCUMENTACION',
        responsable: 'RRHH',
        esOpcional: false,
        requiereAprobacion: false,
        creadoEn: new Date().toISOString(),
        actualizadoEn: new Date().toISOString(),
      },
    ];

    render(<EditarPlantillaPage />);

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
