import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '../sidebar';
import { MobileSidebar } from '../mobile-sidebar';
import { UserNav } from '../user-nav';
import { VersionDisplay } from '../version-display';

const navigationMocks = vi.hoisted(() => ({
  pathname: '/dashboard',
  getNavigationForRole: vi.fn(),
  isNavItemActive: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  user: {
    id: 'u-1',
    nombre: 'Ana',
    apellidos: 'Lopez',
    email: 'ana@test.com',
    rol: 'ADMIN',
  },
  logout: vi.fn(),
}));

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigationMocks.pathname,
  useRouter: () => ({ push: routerMocks.push }),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    onClick,
    className,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    [key: string]: unknown;
  }) => (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onClick?.();
      }}
      className={className}
      {...rest}
    >
      {children}
    </a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: authMocks.user, logout: authMocks.logout }),
}));

vi.mock('@/lib/navigation', () => ({
  getNavigationForRole: (...args: unknown[]) => navigationMocks.getNavigationForRole(...args),
  isNavItemActive: (...args: unknown[]) => navigationMocks.isNavItemActive(...args),
}));

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

function Icon() {
  return <svg data-testid="nav-icon" />;
}

describe('Sidebar and MobileSidebar', () => {
  beforeEach(() => {
    navigationMocks.getNavigationForRole.mockReset();
    navigationMocks.isNavItemActive.mockReset();
    authMocks.logout.mockReset();
    routerMocks.push.mockReset();

    navigationMocks.getNavigationForRole.mockReturnValue([
      { href: '/dashboard', title: 'Dashboard', icon: Icon },
      { href: '/proyectos', title: 'Proyectos', icon: Icon },
    ]);
    navigationMocks.isNavItemActive.mockImplementation((href: string, pathname: string) => href === pathname);
  });

  it('renderiza sidebar y marca enlace activo', () => {
    render(<Sidebar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Proyectos')).toBeInTheDocument();
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('aria-current', 'page');
  });

  it('cierra mobile sidebar al pulsar un link', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(<MobileSidebar open={true} onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole('link', { name: /dashboard/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('UserNav', () => {
  beforeEach(() => {
    authMocks.logout.mockReset();
    routerMocks.push.mockReset();
  });

  it('abre dropdown y muestra datos de usuario', async () => {
    const user = userEvent.setup();
    render(<UserNav />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByText('Ana Lopez')).toBeInTheDocument();
    expect(screen.getByText('ana@test.com')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('ejecuta logout y navega a login', async () => {
    const user = userEvent.setup();
    authMocks.logout.mockResolvedValue(undefined);

    render(<UserNav />);

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByRole('button', { name: /cerrar sesion/i }));

    await waitFor(() => {
      expect(authMocks.logout).toHaveBeenCalled();
      expect(routerMocks.push).toHaveBeenCalledWith('/login');
    });
  });
});

describe('VersionDisplay', () => {
  it('renderiza versión por defecto cuando no hay env', () => {
    const previous = process.env.NEXT_PUBLIC_APP_VERSION;
    delete process.env.NEXT_PUBLIC_APP_VERSION;

    render(<VersionDisplay />);
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();

    process.env.NEXT_PUBLIC_APP_VERSION = previous;
  });

  it('renderiza versión desde variable de entorno', () => {
    process.env.NEXT_PUBLIC_APP_VERSION = '9.9.9';
    render(<VersionDisplay />);
    expect(screen.getByText('v9.9.9')).toBeInTheDocument();
  });
});
