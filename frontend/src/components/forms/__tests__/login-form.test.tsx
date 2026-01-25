import React from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../login-form';

const authMocks = vi.hoisted(() => ({
  login: vi.fn(),
  verifyMfa: vi.fn(),
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
    await user.type(screen.getByLabelText(/contrasena/i), 'Password123!');
    await user.click(screen.getByRole('button', { name: /iniciar sesion/i }));

    expect(authMocks.login).toHaveBeenCalledWith('user@example.com', 'Password123!');

    const codeInput = await screen.findByLabelText(/codigo mfa/i);
    await user.type(codeInput, '123456');
    await user.click(screen.getByRole('button', { name: /verificar codigo/i }));

    expect(authMocks.verifyMfa).toHaveBeenCalledWith('mfa-token', '123456');
    expect(routerMocks.push).toHaveBeenCalledWith('/dashboard');
  });
});
