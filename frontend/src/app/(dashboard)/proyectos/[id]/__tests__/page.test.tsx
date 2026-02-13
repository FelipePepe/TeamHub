import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProyectoDetailPage from '../page';

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    use: (value: unknown) => value,
  };
});

const routerMocks = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn() }));
const permsMocks = vi.hoisted(() => ({ canManageProjects: true }));
const dataMocks = vi.hoisted(() => ({
  proyecto: { data: undefined as unknown, isLoading: false, error: null as unknown },
  stats: { data: undefined as unknown },
  asignaciones: { data: { data: [] } as unknown },
  tareas: { data: { data: [] } as unknown, isLoading: false },
  empleados: { data: { data: [] } as unknown },
}));
const mutMocks = vi.hoisted(() => ({
  updateEstado: vi.fn(),
  deleteProyecto: vi.fn(),
  createAsig: vi.fn(),
  deleteAsig: vi.fn(),
}));
const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => routerMocks }));
vi.mock('@/hooks/use-permissions', () => ({ usePermissions: () => permsMocks }));
vi.mock('@/hooks/use-proyectos', () => ({
  useProyecto: () => dataMocks.proyecto,
  useProyectoStats: () => dataMocks.stats,
  useAsignaciones: () => dataMocks.asignaciones,
  useUpdateProyectoEstado: () => ({ mutateAsync: mutMocks.updateEstado }),
  useDeleteProyecto: () => ({ mutateAsync: mutMocks.deleteProyecto, isPending: false }),
  useCreateAsignacion: () => ({ mutateAsync: mutMocks.createAsig, isPending: false }),
  useDeleteAsignacion: () => ({ mutateAsync: mutMocks.deleteAsig, isPending: false }),
}));
vi.mock('@/hooks/use-empleados', () => ({ useEmpleados: () => dataMocks.empleados }));
vi.mock('@/hooks/use-tareas', () => ({ useTareasByProyecto: () => dataMocks.tareas }));
vi.mock('@/components/tareas/task-list', () => ({ TaskList: () => <div>TaskListMock</div> }));
vi.mock('@/components/tareas/task-gantt-chart', () => ({ TaskGanttChart: () => <div>TaskGanttChartMock</div> }));
vi.mock('sonner', () => ({ toast: toastMocks }));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/select', async () => {
  const ReactLib = await vi.importActual<typeof import('react')>('react');
  const Ctx = ReactLib.createContext<{ onValueChange?: (value: string) => void }>({});
  return {
    Select: ({
      children,
      onValueChange,
    }: {
      children: React.ReactNode;
      onValueChange?: (value: string) => void;
    }) => <Ctx.Provider value={{ onValueChange }}>{children}</Ctx.Provider>,
    SelectTrigger: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
    SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder ?? ''}</span>,
    SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectItem: ({
      children,
      value,
    }: {
      children: React.ReactNode;
      value: string;
    }) => {
      const { onValueChange } = ReactLib.useContext(Ctx);
      return (
        <button type="button" onClick={() => onValueChange?.(value)}>
          {children}
        </button>
      );
    },
  };
});

describe('Proyectos/[id] page', () => {
  beforeEach(() => {
    routerMocks.push.mockReset();
    routerMocks.back.mockReset();
    Object.values(mutMocks).forEach((m) => m.mockReset());
    toastMocks.success.mockReset();
    toastMocks.error.mockReset();

    dataMocks.proyecto = { data: undefined, isLoading: false, error: null };
    dataMocks.stats = { data: undefined };
    dataMocks.asignaciones = { data: { data: [] } };
    dataMocks.tareas = { data: { data: [] }, isLoading: false };
    dataMocks.empleados = { data: { data: [{ id: 'u1', nombre: 'Ana', apellidos: 'Lopez', email: 'ana@test.com' }] } };
    permsMocks.canManageProjects = true;

    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  it('renderiza loading y error', () => {
    const { rerender } = render(<ProyectoDetailPage params={{ id: 'p1' } as never} />);

    dataMocks.proyecto = { data: undefined, isLoading: true, error: null };
    rerender(<ProyectoDetailPage params={{ id: 'p1' } as never} />);
    expect(document.querySelectorAll('[class*="skeleton"], [class*="animate-pulse"]').length).toBeGreaterThan(0);

    dataMocks.proyecto = { data: undefined, isLoading: false, error: new Error('boom') };
    rerender(<ProyectoDetailPage params={{ id: 'p1' } as never} />);
    expect(screen.getByText(/no se pudo cargar el proyecto/i)).toBeInTheDocument();
  });

  it('renderiza detalle y ejecuta acciones principales', async () => {
    const user = userEvent.setup();
    mutMocks.updateEstado.mockResolvedValue({});
    mutMocks.deleteProyecto.mockResolvedValue({});

    dataMocks.proyecto = {
      data: {
        id: 'p1',
        nombre: 'Proyecto Atlas',
        codigo: 'ATL-01',
        estado: 'ACTIVO',
        cliente: 'Acme',
        fechaInicio: '2026-01-01',
      },
      isLoading: false,
      error: null,
    };
    dataMocks.stats = { data: { presupuestoHoras: 100, horasConsumidas: 20, asignacionesActivas: 1, progreso: 0.2 } };
    dataMocks.asignaciones = { data: { data: [{ id: 'a1', usuarioId: 'u1', fechaInicio: '2026-01-01', rol: 'Dev' }] } };

    render(<ProyectoDetailPage params={{ id: 'p1' } as never} />);

    expect(screen.getByText('Proyecto Atlas')).toBeInTheDocument();
    expect(screen.getByText('TaskListMock')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /eliminar/i }));
    await user.click(screen.getByRole('button', { name: /editar/i }));

    await waitFor(() => {
      expect(mutMocks.deleteProyecto).toHaveBeenCalledWith('p1');
      expect(routerMocks.push).toHaveBeenCalledWith('/proyectos?editar=p1');
    });
  });

  it('crea y elimina asignación', async () => {
    const user = userEvent.setup();
    mutMocks.createAsig.mockResolvedValue({});
    mutMocks.deleteAsig.mockResolvedValue({});

    dataMocks.proyecto = {
      data: { id: 'p1', nombre: 'Proyecto Atlas', codigo: 'ATL-01', estado: 'ACTIVO' },
      isLoading: false,
      error: null,
    };
    dataMocks.asignaciones = { data: { data: [{ id: 'a1', usuarioId: 'u1', fechaInicio: '2026-01-01' }] } };

    render(<ProyectoDetailPage params={{ id: 'p1' } as never} />);

    await user.click(screen.getByRole('button', { name: /añadir asignación/i }));
    await user.click(await screen.findByRole('button', { name: /ana lopez \(ana@test\.com\)/i }));
    const [fechaInicioInput] = Array.from(document.querySelectorAll('input[type="date"]')) as HTMLInputElement[];
    await user.type(fechaInicioInput, '2026-02-01');
    await user.click(screen.getByRole('button', { name: /^crear$/i }));

    await waitFor(() => {
      expect(mutMocks.createAsig).toHaveBeenCalled();
    });

    const deleteButtons = screen.getAllByRole('button').filter((b) => b.className.includes('text-red-600'));
    if (deleteButtons[0]) await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mutMocks.deleteAsig).toHaveBeenCalled();
    });
  });
});
