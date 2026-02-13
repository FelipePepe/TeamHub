import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions } from '../use-permissions';

const authMocks = vi.hoisted(() => ({
  user: { rol: 'EMPLEADO' } as { rol?: 'ADMIN' | 'RRHH' | 'MANAGER' | 'EMPLEADO' } | null,
}));

vi.mock('../use-auth', () => ({
  useAuth: () => authMocks,
}));

describe('use-permissions', () => {
  it('calcula flags para ADMIN', () => {
    authMocks.user = { rol: 'ADMIN' };
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.canManageUsers).toBe(true);
    expect(result.current.canApproveHours).toBe(true);
    expect(result.current.canCreateOnboarding).toBe(true);
    expect(result.current.hasRole(['ADMIN'])).toBe(true);
  });

  it('calcula flags para RRHH', () => {
    authMocks.user = { rol: 'RRHH' };
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isRRHH).toBe(true);
    expect(result.current.canManageUsers).toBe(true);
    expect(result.current.canManageDepartments).toBe(true);
    expect(result.current.canViewAllOnboardings).toBe(true);
    expect(result.current.canApproveHours).toBe(false);
  });

  it('calcula flags para MANAGER', () => {
    authMocks.user = { rol: 'MANAGER' };
    const { result } = renderHook(() => usePermissions());
    expect(result.current.isManager).toBe(true);
    expect(result.current.canApproveHours).toBe(true);
    expect(result.current.canCreateOnboarding).toBe(true);
    expect(result.current.canManageTemplates).toBe(false);
    expect(result.current.canManageProjects).toBe(true);
  });

  it('calcula flags para EMPLEADO o sin usuario', () => {
    authMocks.user = { rol: 'EMPLEADO' };
    const empleado = renderHook(() => usePermissions()).result.current;
    expect(empleado.isEmpleado).toBe(true);
    expect(empleado.canManageUsers).toBe(false);
    expect(empleado.canManageProjects).toBe(false);

    authMocks.user = null;
    const anon = renderHook(() => usePermissions()).result.current;
    expect(anon.isEmpleado).toBe(false);
    expect(anon.canCreateOnboarding).toBe(false);
    expect(anon.hasRole(['ADMIN'])).toBe(false);
  });
});

