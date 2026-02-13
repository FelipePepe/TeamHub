import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '../theme-toggle';

const themeMocks = vi.hoisted(() => ({
  setTheme: vi.fn(),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ setTheme: themeMocks.setTheme }),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    themeMocks.setTheme.mockReset();
  });

  it('cambia a light/dark/system', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: /light/i }));
    await user.click(screen.getByRole('button', { name: /dark/i }));
    await user.click(screen.getByRole('button', { name: /system/i }));

    expect(themeMocks.setTheme).toHaveBeenCalledWith('light');
    expect(themeMocks.setTheme).toHaveBeenCalledWith('dark');
    expect(themeMocks.setTheme).toHaveBeenCalledWith('system');
  });
});
