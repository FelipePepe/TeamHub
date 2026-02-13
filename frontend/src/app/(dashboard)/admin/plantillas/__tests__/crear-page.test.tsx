import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CrearPlantillaPage from '../crear/page';

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

const permissionsMocks = vi.hoisted(() => ({
  canManageTemplates: true,
}));

vi.mock('@/hooks/use-permissions', () => ({
  usePermissions: () => permissionsMocks,
}));

const departamentosMocks = vi.hoisted(() => ({
  data: {
    data: [{ id: 'd-1', nombre: 'Tecnologia', codigo: 'TECH', activo: true }],
  },
}));

vi.mock('@/hooks/use-departamentos', () => ({
  useDepartamentos: () => ({
    data: departamentosMocks.data,
  }),
}));

const plantillasMutations = vi.hoisted(() => ({
  createPlantillaMutateAsync: vi.fn(),
  createTareaMutateAsync: vi.fn(),
}));

vi.mock('@/hooks/use-plantillas', () => ({
  useCreatePlantilla: () => ({
    mutateAsync: plantillasMutations.createPlantillaMutateAsync,
  }),
  useCreateTareaPlantilla: () => ({
    mutateAsync: plantillasMutations.createTareaMutateAsync,
  }),
}));

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: toastMocks,
}));

describe('CrearPlantillaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    permissionsMocks.canManageTemplates = true;
    plantillasMutations.createPlantillaMutateAsync.mockResolvedValue({ id: 'p-100' });
    plantillasMutations.createTareaMutateAsync.mockResolvedValue({ id: 't-100' });
  });

  it('muestra acceso denegado sin permisos', () => {
    permissionsMocks.canManageTemplates = false;

    render(<CrearPlantillaPage />);

    expect(screen.getByText(/acceso denegado/i)).toBeInTheDocument();
    expect(screen.getByText(/no tienes permisos para crear plantillas/i)).toBeInTheDocument();
  });

  it('renderiza estado inicial sin tareas', () => {
    render(<CrearPlantillaPage />);

    expect(screen.getByText(/nueva plantilla de onboarding/i)).toBeInTheDocument();
    expect(screen.getByText(/no hay tareas añadidas/i)).toBeInTheDocument();
  });

  it('agrega una tarea localmente', async () => {
    const user = userEvent.setup();

    render(<CrearPlantillaPage />);

    await user.click(screen.getByRole('button', { name: /añadir tarea/i }));

    await user.type(
      screen.getByPlaceholderText(/completar formulario de datos personales/i),
      'Revisar contrato'
    );

    await user.click(screen.getByRole('button', { name: /^añadir$/i }));

    expect(screen.getByText('Revisar contrato')).toBeInTheDocument();
    expect(screen.queryByText('No hay tareas añadidas')).not.toBeInTheDocument();
  });

  it('muestra error al guardar plantilla sin tareas', async () => {
    const user = userEvent.setup();

    render(<CrearPlantillaPage />);

    await user.type(screen.getByPlaceholderText(/onboarding desarrollador frontend/i), 'Plantilla Base');
    await user.type(screen.getByPlaceholderText('30'), '30');
    await user.click(screen.getByRole('button', { name: /guardar plantilla/i }));

    expect(toastMocks.error).toHaveBeenCalledWith('Debes añadir al menos una tarea');
    expect(plantillasMutations.createPlantillaMutateAsync).not.toHaveBeenCalled();
  });

  it('guarda plantilla y tareas correctamente', async () => {
    const user = userEvent.setup();

    render(<CrearPlantillaPage />);

    await user.type(screen.getByPlaceholderText(/onboarding desarrollador frontend/i), 'Onboarding QA');
    await user.type(screen.getByPlaceholderText('30'), '30');

    await user.click(screen.getByRole('button', { name: /añadir tarea/i }));
    await user.type(
      screen.getByPlaceholderText(/completar formulario de datos personales/i),
      'Configurar accesos'
    );
    await user.click(screen.getByRole('button', { name: /^añadir$/i }));

    await user.click(screen.getByRole('button', { name: /guardar plantilla/i }));

    await waitFor(() => {
      expect(plantillasMutations.createPlantillaMutateAsync).toHaveBeenCalled();
      expect(plantillasMutations.createTareaMutateAsync).toHaveBeenCalledTimes(1);
      expect(toastMocks.success).toHaveBeenCalledWith('Plantilla creada correctamente');
      expect(routerMocks.push).toHaveBeenCalledWith('/admin/plantillas');
    });
  }, 15000);

  it('muestra error cuando falla la creacion', async () => {
    const user = userEvent.setup();
    plantillasMutations.createPlantillaMutateAsync.mockRejectedValueOnce(new Error('db down'));

    render(<CrearPlantillaPage />);

    await user.type(screen.getByPlaceholderText(/onboarding desarrollador frontend/i), 'Onboarding Fallido');
    await user.type(screen.getByPlaceholderText('30'), '30');

    await user.click(screen.getByRole('button', { name: /añadir tarea/i }));
    await user.type(
      screen.getByPlaceholderText(/completar formulario de datos personales/i),
      'Crear usuario corporativo'
    );
    await user.click(screen.getByRole('button', { name: /^añadir$/i }));

    await user.click(screen.getByRole('button', { name: /guardar plantilla/i }));

    await waitFor(() => {
      expect(toastMocks.error).toHaveBeenCalledWith('Error al crear la plantilla');
    });
  });
});
