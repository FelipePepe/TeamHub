import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FolderKanban,
  Clock,
  Building2,
  FileText,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  children?: NavItem[];
}

export const navigationItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'RRHH', 'MANAGER', 'EMPLEADO'],
  },
  {
    title: 'Onboarding',
    href: '/onboarding',
    icon: ClipboardList,
    roles: ['ADMIN', 'RRHH', 'MANAGER'],
  },
  {
    title: 'Proyectos',
    href: '/proyectos',
    icon: FolderKanban,
    roles: ['ADMIN', 'RRHH', 'MANAGER', 'EMPLEADO'],
  },
  {
    title: 'Timetracking',
    href: '/timetracking',
    icon: Clock,
    roles: ['ADMIN', 'RRHH', 'MANAGER', 'EMPLEADO'],
  },
  {
    title: 'Departamentos',
    href: '/admin/departamentos',
    icon: Building2,
    roles: ['ADMIN', 'RRHH'],
  },
  {
    title: 'Empleados',
    href: '/admin/empleados',
    icon: Users,
    roles: ['ADMIN', 'RRHH'],
  },
  {
    title: 'Plantillas',
    href: '/admin/plantillas',
    icon: FileText,
    roles: ['ADMIN', 'RRHH'],
  },
  {
    title: 'Configuracion',
    href: '/admin/configuracion',
    icon: Settings,
    roles: ['ADMIN'],
  },
];

export function getNavigationForRole(role: UserRole | undefined): NavItem[] {
  if (!role) return [];
  return navigationItems.filter((item) => item.roles.includes(role));
}

export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard';
  }
  return pathname.startsWith(href);
}
