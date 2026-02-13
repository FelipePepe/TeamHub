import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlantillasPage from '../page';

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => routerMocks,
}));

const plantillasMocks = vi.hoisted(() => ({
  data: null as { plantillas: Array<Record<string, unknown>> } | null,
  isLoading: false,
  error: null as unknown,
  deleteMutateAsync: vi.fn(),
  deleteIsPending: false,
  duplicateMutateAsync: vi.fn(),
  duplicateIsPending: false,
}));

vi.mock('@/hooks/use-plantillas', () => ({
  usePlantillas: () => ({
    data: plantillasMocks.data,
    isLoading: plantillasMocks.isLoading,
    error: plantillasMocks.error,
  }),
  useDeletePlantilla: () => ({
    mutateAsync: plantillasMocks.deleteMutateAsync,
    isPending: plantillasMocks.deleteIsPending,
  }),
  useDuplicatePlantilla: () => ({
    mutateAsync: plantillasMocks.duplicateMutateAsync,
    isPending: plantillasMocks.duplicateIsPending,
  }),
}));

const departamentosMocks = vi.hoisted(() => ({
  data: { data: [] as Array<Record<string, unknown>> },
}));

vi.mock('@/hooks/use-departamentos', () => ({
  useDepartamentos: () => ({
    data: departamentosMocks.data,
  }),
}));

const permissionsMocks = vi.hoisted(() => ({
  canManageTemplates: true,
}));

vi.mock('@/hooks/use-permissions', () => ({
  usePermissions: () => permissionsMocks,
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

describe('PlantillasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    permissionsMocks.canManageTemplates = true;
    plantillasMocks.data = {
      plantillas: [
        {
          id: 'p-1',
          nombre: 'Onboarding Frontend',
          descripcion: 'Flujo base',
          departamentoNombre: 'Tecnologia',
          totalTareas: 4,
          duracionEstimadaDias: 14,
          activo: true,
        },
      ],
    };
    plantillasMocks.isLoading = false;
    plantillasMocks.error = null;
    plantillasMocks.deleteMutateAsync.mockResolvedValue(undefined);
    plantillasMocks.duplicateMutateAsync.mockResolvedValue({ id: 'p-2' });
  });

  it('muestra acceso denegado sin permisos', () => {
    permissionsMocks.canManageTemplates = false;

    render(<PlantillasPage />);

    expect(screen.getByText(/acceso denegado/i)).toBeInTheDocument();
  });

  it('muestra estado de carga', () => {
    plantillasMocks.isLoading = true;

    const { container } = render(<PlantillasPage />);

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('muestra estado de error y boton reintentar', () => {
    plantillasMocks.error = new Error('boom');

    render(<PlantillasPage />);

    expect(screen.getByText(/error al cargar plantillas/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay plantillas con filtros activos', () => {
    plantillasMocks.data = { plantillas: [] };

    render(<PlantillasPage />);

    expect(screen.getByText(/no se encontraron plantillas con los filtros seleccionados/i)).toBeInTheDocument();
  });

  it('renderiza lista de plantillas y navega a crear', async () => {
    const user = userEvent.setup();

    render(<PlantillasPage />);

    expect(screen.getAllByText('Onboarding Frontend').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /crear plantilla/i }));

    expect(routerMocks.push).toHaveBeenCalledWith('/admin/plantillas/crear');
  });

  it('duplica plantilla y navega al detalle', async () => {
    const user = userEvent.setup();

    render(<PlantillasPage />);

    await user.click(screen.getAllByTitle('Duplicar')[0]);

    await waitFor(() => {
      expect(plantillasMocks.duplicateMutateAsync).toHaveBeenCalledWith('p-1');
      expect(toastMocks.success).toHaveBeenCalled();
      expect(routerMocks.push).toHaveBeenCalledWith('/admin/plantillas/p-2');
    });
  });

  it('elimina plantilla cuando se confirma', async () => {
    const user = userEvent.setup();
    mockConfirm.mockReturnValue(true);

    render(<PlantillasPage />);

    await user.click(screen.getAllByTitle('Eliminar')[0]);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
      expect(plantillasMocks.deleteMutateAsync).toHaveBeenCalledWith('p-1');
      expect(toastMocks.success).toHaveBeenCalledWith('Plantilla eliminada correctamente');
    });
  });

  it('no elimina plantilla si se cancela confirmacion', async () => {
    const user = userEvent.setup();
    mockConfirm.mockReturnValue(false);

    render(<PlantillasPage />);

    await user.click(screen.getAllByTitle('Eliminar')[0]);

    expect(plantillasMocks.deleteMutateAsync).not.toHaveBeenCalled();
  });
});
