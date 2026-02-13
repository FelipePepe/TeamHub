import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProcesosPage from '../page';

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/onboarding/iniciar-proceso-modal', () => ({
  IniciarProcesoModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="iniciar-proceso-modal">Iniciar Proceso Modal</div> : null,
}));

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => routerMocks,
}));

const permissionsMocks = vi.hoisted(() => ({
  canCreateOnboarding: true,
  canViewAllOnboardings: true,
}));

vi.mock('@/hooks/use-permissions', () => ({
  usePermissions: () => permissionsMocks,
}));

const procesosMocks = vi.hoisted(() => ({
  data: {
    data: [
      {
        id: 'proc-1',
        empleadoNombre: 'Ana Garcia',
        plantillaNombre: 'Onboarding Base',
        fechaInicio: '2026-01-10',
        estado: 'EN_CURSO',
        progreso: '0.5',
      },
      {
        id: 'proc-2',
        empleadoNombre: 'Luis Perez',
        plantillaNombre: 'Onboarding IT',
        fechaInicio: '2026-01-12',
        estado: 'PAUSADO',
        progreso: '0.25',
      },
    ],
  } as { data: Array<Record<string, unknown>> } | undefined,
  isLoading: false,
  error: null as unknown,
  pausarMutateAsync: vi.fn(),
  reanudarMutateAsync: vi.fn(),
  cancelarMutateAsync: vi.fn(),
  pausarPending: false,
  reanudarPending: false,
  cancelarPending: false,
}));

vi.mock('@/hooks/use-procesos', () => ({
  useProcesos: () => ({
    data: procesosMocks.data,
    isLoading: procesosMocks.isLoading,
    error: procesosMocks.error,
  }),
  usePausarProceso: () => ({
    mutateAsync: procesosMocks.pausarMutateAsync,
    isPending: procesosMocks.pausarPending,
  }),
  useReanudarProceso: () => ({
    mutateAsync: procesosMocks.reanudarMutateAsync,
    isPending: procesosMocks.reanudarPending,
  }),
  useCancelarProceso: () => ({
    mutateAsync: procesosMocks.cancelarMutateAsync,
    isPending: procesosMocks.cancelarPending,
  }),
}));

vi.mock('@/hooks/use-departamentos', () => ({
  useDepartamentos: () => ({
    data: { data: [{ id: 'd-1', nombre: 'IT' }] },
  }),
}));

vi.mock('@/hooks/use-empleados', () => ({
  useEmpleados: () => ({
    data: { data: [{ id: 'u-1', nombre: 'Ana', apellidos: 'Garcia' }] },
  }),
}));

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: toastMocks,
}));

const mockConfirm = vi.fn() as ReturnType<typeof vi.fn>;
const mockPrompt = vi.fn() as ReturnType<typeof vi.fn>;
global.confirm = mockConfirm as typeof global.confirm;
global.prompt = mockPrompt as typeof global.prompt;

describe('ProcesosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    permissionsMocks.canCreateOnboarding = true;
    permissionsMocks.canViewAllOnboardings = true;
    procesosMocks.data = {
      data: [
        {
          id: 'proc-1',
          empleadoNombre: 'Ana Garcia',
          plantillaNombre: 'Onboarding Base',
          fechaInicio: '2026-01-10',
          estado: 'EN_CURSO',
          progreso: '0.5',
        },
        {
          id: 'proc-2',
          empleadoNombre: 'Luis Perez',
          plantillaNombre: 'Onboarding IT',
          fechaInicio: '2026-01-12',
          estado: 'PAUSADO',
          progreso: '0.25',
        },
      ],
    };
    procesosMocks.isLoading = false;
    procesosMocks.error = null;
    procesosMocks.pausarMutateAsync.mockResolvedValue(undefined);
    procesosMocks.reanudarMutateAsync.mockResolvedValue(undefined);
    procesosMocks.cancelarMutateAsync.mockResolvedValue(undefined);
    mockConfirm.mockReturnValue(true);
    mockPrompt.mockReturnValue('motivo de prueba');
  });

  it('renderiza procesos y boton iniciar', () => {
    render(<ProcesosPage />);

    expect(screen.getAllByText('Ana Garcia').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /iniciar proceso/i })).toBeInTheDocument();
  });

  it('muestra estado de carga', () => {
    procesosMocks.isLoading = true;

    const { container } = render(<ProcesosPage />);

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('muestra estado de error', () => {
    procesosMocks.error = new Error('boom');

    render(<ProcesosPage />);

    expect(screen.getByText(/error al cargar procesos/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('muestra empty state y CTA inicial', () => {
    procesosMocks.data = { data: [] };

    render(<ProcesosPage />);

    expect(screen.getByText(/no hay procesos iniciados/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar primer proceso/i })).toBeInTheDocument();
  });

  it('abre modal iniciar proceso', async () => {
    const user = userEvent.setup();

    render(<ProcesosPage />);

    await user.click(screen.getByRole('button', { name: /iniciar proceso/i }));

    expect(screen.getByTestId('iniciar-proceso-modal')).toBeInTheDocument();
  });

  it('pausa proceso en curso', async () => {
    const user = userEvent.setup();

    render(<ProcesosPage />);

    await user.click(screen.getByRole('button', { name: /pausar proceso de ana garcia/i }));

    await waitFor(() => {
      expect(procesosMocks.pausarMutateAsync).toHaveBeenCalledWith('proc-1');
      expect(toastMocks.success).toHaveBeenCalled();
    });
  });

  it('reanuda proceso pausado', async () => {
    const user = userEvent.setup();

    render(<ProcesosPage />);

    await user.click(screen.getByRole('button', { name: /reanudar proceso de luis perez/i }));

    await waitFor(() => {
      expect(procesosMocks.reanudarMutateAsync).toHaveBeenCalledWith('proc-2');
      expect(toastMocks.success).toHaveBeenCalled();
    });
  });

  it('cancela proceso con motivo', async () => {
    const user = userEvent.setup();

    render(<ProcesosPage />);

    await user.click(screen.getByRole('button', { name: /cancelar proceso de ana garcia/i }));

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
      expect(mockPrompt).toHaveBeenCalled();
      expect(procesosMocks.cancelarMutateAsync).toHaveBeenCalledWith({
        id: 'proc-1',
        data: { motivo: 'motivo de prueba' },
      });
      expect(toastMocks.success).toHaveBeenCalled();
    });
  });
});
