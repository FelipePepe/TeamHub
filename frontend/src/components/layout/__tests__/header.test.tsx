import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../header';

vi.mock('../user-nav', () => ({
  UserNav: () => <div data-testid="user-nav">UserNav</div>,
}));

vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">ThemeToggle</div>,
}));

vi.mock('../mobile-sidebar', () => ({
  MobileSidebar: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
    <div>
      <span data-testid="mobile-open">{String(open)}</span>
      <button onClick={() => onOpenChange(false)}>close-sidebar</button>
    </div>
  ),
}));

describe('Header', () => {
  it('renderiza título y bloques principales', () => {
    render(<Header title="Dashboard" />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('user-nav')).toBeInTheDocument();
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('abre el menú móvil al pulsar botón hamburguesa', async () => {
    const user = userEvent.setup();
    render(<Header title="Panel" />);

    expect(screen.getByTestId('mobile-open')).toHaveTextContent('false');
    await user.click(screen.getByRole('button', { name: /abrir menú de navegación/i }));
    expect(screen.getByTestId('mobile-open')).toHaveTextContent('true');
  });

  it('no muestra h1 si no recibe título', () => {
    render(<Header />);
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });
});
