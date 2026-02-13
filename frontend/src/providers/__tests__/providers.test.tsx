import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Providers } from '../index';

vi.mock('../query-provider', () => ({
  QueryProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="query">{children}</div>,
}));
vi.mock('../auth-provider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth">{children}</div>,
}));
vi.mock('../theme-provider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="theme">{children}</div>,
}));
vi.mock('sonner', () => ({ Toaster: () => <div data-testid="toaster" /> }));
describe('providers', () => {
  it('compone providers globales y toaster', () => {
    render(
      <Providers>
        <div>Child</div>
      </Providers>
    );

    expect(screen.getByTestId('query')).toBeInTheDocument();
    expect(screen.getByTestId('theme')).toBeInTheDocument();
    expect(screen.getByTestId('auth')).toBeInTheDocument();
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
    expect(screen.getByText('Child')).toBeInTheDocument();
  });
});
