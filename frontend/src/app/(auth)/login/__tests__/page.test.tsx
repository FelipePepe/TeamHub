import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoginPage from '../page';

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock('@/components/forms/login-form', () => ({
  LoginForm: () => <div>LoginFormMock</div>,
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('auth/login/page', () => {
  it('renderiza logo, descripción y formulario', () => {
    render(<LoginPage />);
    expect(screen.getByAltText('TeamHub Logo')).toBeInTheDocument();
    expect(screen.getByText(/ingresa tus credenciales/i)).toBeInTheDocument();
    expect(screen.getByText('LoginFormMock')).toBeInTheDocument();
  });
});

