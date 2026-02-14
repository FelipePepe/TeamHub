'use client';

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardLayout from '../layout';

const routerMocks = vi.hoisted(() => ({ push: vi.fn() }));
const authMocks = vi.hoisted(() => ({ isAuthenticated: true, isLoading: false }));

vi.mock('next/navigation', () => ({ useRouter: () => routerMocks }));
vi.mock('@/hooks/use-auth', () => ({ useAuth: () => authMocks }));
vi.mock('@/components/layout/sidebar', () => ({ Sidebar: () => <aside>Sidebar</aside> }));
vi.mock('@/components/layout/header', () => ({ Header: () => <header>Header</header> }));
vi.mock('@/components/layout/version-display', () => ({ VersionDisplay: () => <div>Version</div> }));
vi.mock('@/components/ui/skeleton', () => ({ Skeleton: () => <div data-testid="skeleton" /> }));

describe('dashboard/layout', () => {
  beforeEach(() => {
    routerMocks.push.mockReset();
    authMocks.isAuthenticated = true;
    authMocks.isLoading = false;
  });

  it('muestra loading mientras autentica', () => {
    authMocks.isLoading = true;
    render(
      <DashboardLayout>
        <div>Child</div>
      </DashboardLayout>
    );
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('redirige a login cuando no está autenticado', async () => {
    authMocks.isAuthenticated = false;
    render(
      <DashboardLayout>
        <div>Child</div>
      </DashboardLayout>
    );
    await waitFor(() => {
      expect(routerMocks.push).toHaveBeenCalledWith('/login');
    });
  });

  it('renderiza layout completo autenticado', () => {
    render(
      <DashboardLayout>
        <div>Panel</div>
      </DashboardLayout>
    );
    expect(screen.getByText('Sidebar')).toBeInTheDocument();
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Panel')).toBeInTheDocument();
    expect(screen.getByText('Version')).toBeInTheDocument();
  });
});

