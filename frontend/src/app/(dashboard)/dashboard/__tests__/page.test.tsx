import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardPage from '../page';

const authMocks = vi.hoisted(() => ({
  user: { nombre: 'Ana', rol: 'EMPLEADO' } as { nombre: string; rol: 'ADMIN' | 'RRHH' | 'MANAGER' | 'EMPLEADO' },
}));

vi.mock('@/hooks/use-auth', () => ({ useAuth: () => authMocks }));
vi.mock('@/components/dashboard', () => ({
  AdminDashboard: () => <div>AdminDashboard</div>,
  RRHHDashboard: () => <div>RRHHDashboard</div>,
  ManagerDashboard: () => <div>ManagerDashboard</div>,
  EmpleadoDashboard: () => <div>EmpleadoDashboard</div>,
}));

describe('dashboard/page', () => {
  beforeEach(() => {
    authMocks.user = { nombre: 'Ana', rol: 'EMPLEADO' };
  });

  it('renderiza dashboard de admin', () => {
    authMocks.user = { nombre: 'Admin', rol: 'ADMIN' };
    render(<DashboardPage />);
    expect(screen.getByText(/bienvenido, admin/i)).toBeInTheDocument();
    expect(screen.getByText(/panel de administrador/i)).toBeInTheDocument();
    expect(screen.getByText('AdminDashboard')).toBeInTheDocument();
  });

  it('renderiza dashboard de rrhh', () => {
    authMocks.user = { nombre: 'RRHH', rol: 'RRHH' };
    render(<DashboardPage />);
    expect(screen.getByText(/panel de recursos humanos/i)).toBeInTheDocument();
    expect(screen.getByText('RRHHDashboard')).toBeInTheDocument();
  });

  it('renderiza dashboard de manager', () => {
    authMocks.user = { nombre: 'Manager', rol: 'MANAGER' };
    render(<DashboardPage />);
    expect(screen.getByText(/panel de manager/i)).toBeInTheDocument();
    expect(screen.getByText('ManagerDashboard')).toBeInTheDocument();
  });

  it('renderiza dashboard por defecto de empleado', () => {
    authMocks.user = { nombre: 'Ana', rol: 'EMPLEADO' };
    render(<DashboardPage />);
    expect(screen.getByText(/panel de empleado/i)).toBeInTheDocument();
    expect(screen.getByText('EmpleadoDashboard')).toBeInTheDocument();
  });
});

