'use client';

import { useMemo } from 'react';
import { useAuth } from './use-auth';
import type { UserRole } from '@/types';

/**
 * Hook para verificación de permisos client-side.
 * 
 * ⚠️ LIMITACIÓN DE SEGURIDAD:
 * Los permisos se calculan desde el estado del cliente y NO sustituyen
 * la validación de permisos server-side. Un atacante puede modificar el
 * estado de React para cambiar su rol y ver opciones de UI no autorizadas.
 * 
 * Este hook solo debe usarse para:
 * - Mostrar/ocultar elementos de UI
 * - Navegación condicional
 * - UX mejorada
 * 
 * La autorización real SIEMPRE se valida en el backend mediante:
 * - authMiddleware (verifica JWT)
 * - requireRoles(...) (verifica permisos específicos)
 * 
 * @see backend/src/middleware/auth.ts
 * @see backend/src/middleware/require-roles.ts
 */
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
