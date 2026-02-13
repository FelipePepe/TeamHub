import React from 'react';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PerfilPage from '../page';

const authMocks = vi.hoisted(() => ({
  user: {
    id: 'u1',
    email: 'ana@test.com',
    nombre: 'Ana',
    apellidos: 'Lopez',
    rol: 'EMPLEADO',
    activo: true,
  },
  refreshUser: vi.fn(),
}));

const apiMocks = vi.hoisted(() => ({ put: vi.fn(), patch: vi.fn() }));
const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('@/hooks/use-auth', () => ({ useAuth: () => authMocks }));
vi.mock('@/lib/api', () => ({
  put: (...args: unknown[]) => (apiMocks.put as Mock)(...args),
  patch: (...args: unknown[]) => (apiMocks.patch as Mock)(...args),
}));
vi.mock('sonner', () => ({ toast: toastMocks }));

describe('PerfilPage', () => {
  beforeEach(() => {
    apiMocks.put.mockReset();
    apiMocks.patch.mockReset();
    authMocks.refreshUser.mockReset();
    toastMocks.success.mockReset();
    toastMocks.error.mockReset();
  });

  it('actualiza perfil', async () => {
    const user = userEvent.setup();
    apiMocks.put.mockResolvedValue({});

    render(<PerfilPage />);

    const nombre = screen.getByLabelText(/^nombre$/i);
    await user.clear(nombre);
    await user.type(nombre, 'Ana Maria');
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(apiMocks.put).toHaveBeenCalled();
      expect(authMocks.refreshUser).toHaveBeenCalled();
      expect(toastMocks.success).toHaveBeenCalledWith('Perfil actualizado correctamente');
    });
  });

  it('valida y cambia contraseña', async () => {
    const user = userEvent.setup();
    apiMocks.patch.mockResolvedValue({});

    render(<PerfilPage />);

    await user.type(screen.getByLabelText(/contraseña actual/i), 'oldpass123');
    await user.type(screen.getByLabelText(/^nueva contraseña/i), 'newpass123');
    await user.type(screen.getByLabelText(/confirmar contraseña/i), 'newpass123');
    await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

    await waitFor(() => {
      expect(apiMocks.patch).toHaveBeenCalled();
      expect(toastMocks.success).toHaveBeenCalledWith('Contraseña actualizada correctamente');
    });
  }, 15000);

  it('muestra validaciones de contraseña', async () => {
    const user = userEvent.setup();
    render(<PerfilPage />);

    await user.click(screen.getByRole('button', { name: /cambiar contraseña/i }));
    expect(toastMocks.error).toHaveBeenCalledWith('Todos los campos de contraseña son obligatorios');
  });
});
