'use client';

import { useMemo } from 'react';
import { useAuth } from './use-auth';
import type { UserRole } from '@/types';

export function usePermissions() {
  const { user } = useAuth();

  return useMemo(() => {
    const rol = user?.rol;

    return {
      // Role checks
      isAdmin: rol === 'ADMIN',
      isRRHH: rol === 'RRHH',
      isManager: rol === 'MANAGER',
      isEmpleado: rol === 'EMPLEADO',

      // Permission checks
      canManageUsers: (['ADMIN', 'RRHH'] as UserRole[]).includes(rol as UserRole),
      canManageDepartments: (['ADMIN', 'RRHH'] as UserRole[]).includes(rol as UserRole),
      canApproveHours: (['ADMIN', 'MANAGER'] as UserRole[]).includes(rol as UserRole),
      canCreateOnboarding: (['ADMIN', 'RRHH', 'MANAGER'] as UserRole[]).includes(rol as UserRole),
      canViewAllOnboardings: (['ADMIN', 'RRHH'] as UserRole[]).includes(rol as UserRole),
      canManageTemplates: (['ADMIN', 'RRHH'] as UserRole[]).includes(rol as UserRole),
      canManageProjects: (['ADMIN', 'RRHH', 'MANAGER'] as UserRole[]).includes(rol as UserRole),

      // Helper
      hasRole: (roles: UserRole[]) => roles.includes(rol as UserRole),
    };
  }, [user?.rol]);
}
