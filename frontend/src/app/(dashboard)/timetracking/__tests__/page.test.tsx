import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimetrackingPage from '../page';

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange }: { children: React.ReactNode; onValueChange?: (v: string) => void }) => (
    <div>
      <button type="button" onClick={() => onValueChange?.('p-1')}>SelectMock</button>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/timetracking/week-navigation', () => ({
  WeekNavigation: () => <div data-testid="week-navigation">Week Navigation</div>,
}));

vi.mock('@/components/timetracking/timesheet-grid', () => ({
  TimesheetGrid: () => <div data-testid="timesheet-grid">Timesheet Grid</div>,
}));

vi.mock('@/components/timetracking/copy-week-dialog', () => ({
  CopyWeekDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="copy-week-dialog">Copy Week Dialog</div> : null,
}));

vi.mock('@/components/timetracking/gantt-chart', () => ({
  GanttChart: () => <div data-testid="gantt-chart">Gantt</div>,
}));

vi.mock('@/lib/gantt-utils', () => ({
  calculateProgress: () => 50,
}));

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => routerMocks,
}));

const permissionsMocks = vi.hoisted(() => ({
  canApproveHours: true,
}));

vi.mock('@/hooks/use-permissions', () => ({
  usePermissions: () => permissionsMocks,
}));

const timetrackingMocks = vi.hoisted(() => ({
  misRegistrosData: {
    data: [
      {
        id: 'r-1',
        fecha: '2026-02-10',
        horas: 4,
        descripcion: 'Analisis',
        estado: 'APROBADO',
        proyectoId: 'p-1',
      },
    ],
  } as { data: Array<Record<string, unknown>> } | undefined,
  misRegistrosLoading: false,
  misRegistrosError: null as unknown,
  resumenData: { totalHoras: 10, horasFacturables: 8, horasNoFacturables: 2 },
  semanaData: { data: [] as Array<Record<string, unknown>> },
  semanaLoading: false,
  createMutateAsync: vi.fn(),
  createPending: false,
  updateMutateAsync: vi.fn(),
  copyMutateAsync: vi.fn(),
  copyPending: false,
}));

vi.mock('@/hooks/use-timetracking', () => ({
  useMisRegistros: () => ({
    data: timetrackingMocks.misRegistrosData,
    isLoading: timetrackingMocks.misRegistrosLoading,
    error: timetrackingMocks.misRegistrosError,
  }),
  useResumenTimetracking: () => ({
    data: timetrackingMocks.resumenData,
  }),
  useCreateTimeEntry: () => ({
    mutateAsync: timetrackingMocks.createMutateAsync,
    isPending: timetrackingMocks.createPending,
  }),
  useTimeEntriesSemana: () => ({
    data: timetrackingMocks.semanaData,
    isLoading: timetrackingMocks.semanaLoading,
  }),
  useUpdateTimeEntry: () => ({
    mutateAsync: timetrackingMocks.updateMutateAsync,
  }),
  useCopiarRegistros: () => ({
    mutateAsync: timetrackingMocks.copyMutateAsync,
    isPending: timetrackingMocks.copyPending,
  }),
}));

vi.mock('@/hooks/use-proyectos', () => ({
  useProyectos: () => ({
    data: { data: [{ id: 'p-1', nombre: 'Atlas', codigo: 'ATL' }] },
  }),
  useMisProyectos: () => ({
    data: { data: [{ id: 'p-1', nombre: 'Atlas', codigo: 'ATL', fechaInicio: '2026-01-01', fechaFinEstimada: '2026-03-01' }] },
    isLoading: false,
  }),
}));

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: toastMocks,
}));

describe('TimetrackingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    permissionsMocks.canApproveHours = true;
    timetrackingMocks.misRegistrosData = {
      data: [
        {
          id: 'r-1',
          fecha: '2026-02-10',
          horas: 4,
          descripcion: 'Analisis',
          estado: 'APROBADO',
          proyectoId: 'p-1',
        },
      ],
    };
    timetrackingMocks.misRegistrosLoading = false;
    timetrackingMocks.misRegistrosError = null;
    timetrackingMocks.createMutateAsync.mockResolvedValue(undefined);
    timetrackingMocks.updateMutateAsync.mockResolvedValue(undefined);
    timetrackingMocks.copyMutateAsync.mockResolvedValue({ copied: 1, message: 'ok' });
  });

  it('renderiza resumen y registros', () => {
    render(<TimetrackingPage />);

    expect(screen.getByText('Timetracking')).toBeInTheDocument();
    expect(screen.getByText('10.00')).toBeInTheDocument();
    expect(screen.getByText('Analisis')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pendientes de aprobación/i })).toBeInTheDocument();
  });

  it('muestra estado de carga en registros', () => {
    timetrackingMocks.misRegistrosLoading = true;

    const { container } = render(<TimetrackingPage />);

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('muestra estado de error en registros', () => {
    timetrackingMocks.misRegistrosError = new Error('boom');

    render(<TimetrackingPage />);

    expect(screen.getByText(/error al cargar registros/i)).toBeInTheDocument();
  });

  it('muestra empty state de registros', () => {
    timetrackingMocks.misRegistrosData = { data: [] };

    render(<TimetrackingPage />);

    expect(screen.getByText(/no hay registros/i)).toBeInTheDocument();
  });

  it('valida campos obligatorios en modal', async () => {
    const user = userEvent.setup();

    render(<TimetrackingPage />);

    await user.click(screen.getAllByRole('button', { name: /registrar horas/i })[0]);
    await user.click(screen.getByRole('button', { name: /crear registro/i }));

    expect(timetrackingMocks.createMutateAsync).not.toHaveBeenCalled();
  });
});
