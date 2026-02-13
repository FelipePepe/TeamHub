import React from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../login-form';

const authMocks = vi.hoisted(() => ({
  login: vi.fn(),
  verifyMfa: vi.fn(),
  changePassword: vi.fn(),
  setupMfa: vi.fn(),
}));

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    login: authMocks.login,
    verifyMfa: authMocks.verifyMfa,
    changePassword: authMocks.changePassword,
    setupMfa: authMocks.setupMfa,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: routerMocks.push,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: toastMocks.success,
    error: toastMocks.error,
  },
}));

describe('LoginForm MFA flow', () => {
  beforeEach(() => {
    authMocks.login.mockReset();
    authMocks.verifyMfa.mockReset();
    authMocks.changePassword.mockReset();
    authMocks.setupMfa.mockReset();
    routerMocks.push.mockReset();
    toastMocks.success.mockReset();
    toastMocks.error.mockReset();
  });

  it('requests MFA code after login and completes verification', async () => {
    const user = userEvent.setup();
    authMocks.login.mockResolvedValue({
      mfaRequired: true,
      mfaToken: 'mfa-token',
    });
    authMocks.verifyMfa.mockResolvedValue(undefined);

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'Password123!');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(authMocks.login).toHaveBeenCalledWith('user@example.com', 'Password123!');

    const codeInput = await screen.findByLabelText(/código mfa/i);
    await user.type(codeInput, '123456');
    await user.click(screen.getByRole('button', { name: /verificar código/i }));

    expect(authMocks.verifyMfa).toHaveBeenCalledWith('mfa-token', '123456');
    expect(routerMocks.push).toHaveBeenCalledWith('/dashboard');
  });

  it('shows friendly error message on 401 login', async () => {
    const user = userEvent.setup();
    authMocks.login.mockRejectedValue({
      isAxiosError: true,
      response: { status: 401 },
    });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'Password123!');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(toastMocks.error).toHaveBeenCalledWith('Usuario y/o contraseña incorrectos');
  });

  it('shows generic error when token is missing', async () => {
    const user = userEvent.setup();
    authMocks.login.mockResolvedValue({});

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'Password123!');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(toastMocks.error).toHaveBeenCalledWith('Error al iniciar sesión');
  });

  it('validates MFA code format before submit', async () => {
    const user = userEvent.setup();
    authMocks.login.mockResolvedValue({
      mfaRequired: true,
      mfaToken: 'mfa-token',
    });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'Password123!');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await user.type(await screen.findByLabelText(/código mfa/i), '12');
    await user.click(screen.getByRole('button', { name: /verificar código/i }));

    expect(await screen.findByText(/código mfa inválido/i)).toBeInTheDocument();
    expect(authMocks.verifyMfa).not.toHaveBeenCalled();
  });

  it('allows cancel in change-password step and returns to login', async () => {
    const user = userEvent.setup();
    authMocks.login.mockResolvedValue({
      mfaToken: 'mfa-token',
      passwordChangeRequired: true,
    });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'Password123!');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(await screen.findByText(/cambio de contraseña requerido/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(await screen.findByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });
});
