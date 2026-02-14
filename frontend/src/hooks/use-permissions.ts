'use client';

import { useMemo } from 'react';
import { useAuth } from './use-auth';
import type { UserRole } from '@/types';

const USER_MANAGEMENT_ROLES = ['ADMIN', 'RRHH'] as const;
const HOURS_APPROVER_ROLES = ['ADMIN', 'MANAGER'] as const;
const ONBOARDING_CREATOR_ROLES = ['ADMIN', 'RRHH', 'MANAGER'] as const;
const ONBOARDING_VIEW_ALL_ROLES = ['ADMIN', 'RRHH'] as const;
const TEMPLATE_MANAGEMENT_ROLES = ['ADMIN', 'RRHH'] as const;
const PROJECT_MANAGEMENT_ROLES = ['ADMIN', 'RRHH', 'MANAGER'] as const;

/**
 * Evalúa si un rol actual pertenece a un conjunto de roles permitidos.
 */
function hasAllowedRole(
  currentRole: UserRole | undefined,
  allowedRoles: readonly UserRole[]
): boolean {
  return Boolean(currentRole && allowedRoles.includes(currentRole));
}

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
      canManageUsers: hasAllowedRole(rol, USER_MANAGEMENT_ROLES),
      canManageDepartments: hasAllowedRole(rol, USER_MANAGEMENT_ROLES),
      canApproveHours: hasAllowedRole(rol, HOURS_APPROVER_ROLES),
      canCreateOnboarding: hasAllowedRole(rol, ONBOARDING_CREATOR_ROLES),
      canViewAllOnboardings: hasAllowedRole(rol, ONBOARDING_VIEW_ALL_ROLES),
      canManageTemplates: hasAllowedRole(rol, TEMPLATE_MANAGEMENT_ROLES),
      canManageProjects: hasAllowedRole(rol, PROJECT_MANAGEMENT_ROLES),

      // Helper
      hasRole: (roles: UserRole[]) => hasAllowedRole(rol, roles),
    };
  }, [user?.rol]);
}
