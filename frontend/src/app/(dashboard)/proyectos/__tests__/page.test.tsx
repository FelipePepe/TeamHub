import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProyectosPage from '../page';

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/forms/proyecto-form', () => ({
  ProyectoForm: ({ open }: { open: boolean }) =>
    open ? <div data-testid="proyecto-form-modal">ProyectoForm Open</div> : null,
}));

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

const searchParamsMocks = vi.hoisted(() => ({
  get: vi.fn(() => null),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => routerMocks,
  useSearchParams: () => searchParamsMocks,
}));

const permissionsMocks = vi.hoisted(() => ({
  canManageProjects: true,
}));

vi.mock('@/hooks/use-permissions', () => ({
  usePermissions: () => permissionsMocks,
}));

const proyectosMocks = vi.hoisted(() => ({
  data: {
    data: [
      {
        id: 'pr-1',
        nombre: 'Proyecto Atlas',
        codigo: 'ATL-001',
        cliente: 'Cliente Uno',
        estado: 'ACTIVO',
        fechaFinEstimada: '2026-12-31',
        presupuestoHoras: 120,
        horasConsumidas: 40,
      },
    ],
  } as { data: Array<Record<string, unknown>> } | undefined,
  isLoading: false,
  error: null as unknown,
  deleteMutateAsync: vi.fn(),
}));

vi.mock('@/hooks/use-proyectos', () => ({
  useProyectos: () => ({
    data: proyectosMocks.data,
    isLoading: proyectosMocks.isLoading,
    error: proyectosMocks.error,
  }),
  useDeleteProyecto: () => ({
    mutateAsync: proyectosMocks.deleteMutateAsync,
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
global.confirm = mockConfirm as typeof global.confirm;

describe('ProyectosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    permissionsMocks.canManageProjects = true;
    searchParamsMocks.get.mockReturnValue(null);
    proyectosMocks.data = {
      data: [
        {
          id: 'pr-1',
          nombre: 'Proyecto Atlas',
          codigo: 'ATL-001',
          cliente: 'Cliente Uno',
          estado: 'ACTIVO',
          fechaFinEstimada: '2026-12-31',
          presupuestoHoras: 120,
          horasConsumidas: 40,
        },
      ],
    };
    proyectosMocks.isLoading = false;
    proyectosMocks.error = null;
    proyectosMocks.deleteMutateAsync.mockResolvedValue(undefined);
  });

  it('renderiza listado de proyectos y boton crear', () => {
    render(<ProyectosPage />);

    expect(screen.getAllByText('Proyecto Atlas').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /crear proyecto/i })).toBeInTheDocument();
  });

  it('oculta boton crear sin permisos', () => {
    permissionsMocks.canManageProjects = false;

    render(<ProyectosPage />);

    expect(screen.queryByRole('button', { name: /crear proyecto/i })).not.toBeInTheDocument();
  });

  it('muestra estado de carga', () => {
    proyectosMocks.isLoading = true;

    const { container } = render(<ProyectosPage />);

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('muestra estado de error', () => {
    proyectosMocks.error = new Error('boom');

    render(<ProyectosPage />);

    expect(screen.getByText(/error al cargar proyectos/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('muestra empty state cuando no hay proyectos', () => {
    proyectosMocks.data = { data: [] };

    render(<ProyectosPage />);

    expect(screen.getByText(/no se encontraron proyectos/i)).toBeInTheDocument();
  });

  it('filtra por texto de busqueda', async () => {
    const user = userEvent.setup();

    render(<ProyectosPage />);

    await user.type(screen.getByPlaceholderText(/buscar por nombre, código o cliente/i), 'atlas');

    expect(screen.getByDisplayValue('atlas')).toBeInTheDocument();
  });

  it('elimina proyecto cuando se confirma', async () => {
    const user = userEvent.setup();
    mockConfirm.mockReturnValue(true);

    render(<ProyectosPage />);
    await user.click(screen.getByRole('button', { name: /vista tabla/i }));

    await user.click(screen.getAllByTitle('Eliminar')[0]);

    await waitFor(() => {
      expect(proyectosMocks.deleteMutateAsync).toHaveBeenCalledWith('pr-1');
      expect(toastMocks.success).toHaveBeenCalledWith('Proyecto eliminado');
    });
  });

  it('no elimina si se cancela confirmacion', async () => {
    const user = userEvent.setup();
    mockConfirm.mockReturnValue(false);

    render(<ProyectosPage />);
    await user.click(screen.getByRole('button', { name: /vista tabla/i }));

    await user.click(screen.getAllByTitle('Eliminar')[0]);

    expect(proyectosMocks.deleteMutateAsync).not.toHaveBeenCalled();
  });

  it('abre modal de creacion desde query param crear=1', async () => {
    searchParamsMocks.get.mockReturnValue('1');

    render(<ProyectosPage />);

    await waitFor(() => {
      expect(screen.getByTestId('proyecto-form-modal')).toBeInTheDocument();
      expect(routerMocks.replace).toHaveBeenCalledWith('/proyectos', { scroll: false });
    });
  });
});
