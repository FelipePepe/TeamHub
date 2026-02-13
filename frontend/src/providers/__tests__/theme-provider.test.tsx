import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../theme-provider';

vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="next-theme">{children}</div>,
}));

describe('theme-provider', () => {
  it('delega en next-themes ThemeProvider', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div>ThemeChild</div>
      </ThemeProvider>
    );
    expect(screen.getByTestId('next-theme')).toBeInTheDocument();
    expect(screen.getByText('ThemeChild')).toBeInTheDocument();
  });
});

