import type {
  AdminDashboardData,
  RRHHDashboardData,
  ManagerDashboardData,
  EmpleadoDashboardData,
} from '@/types/dashboard';
import type { UserRole } from '@/types';
import { get } from './api';

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  return get<AdminDashboardData>('/dashboard/admin');
}

export async function getRRHHDashboard(): Promise<RRHHDashboardData> {
  return get<RRHHDashboardData>('/dashboard/rrhh');
}

export async function getManagerDashboard(): Promise<ManagerDashboardData> {
  return get<ManagerDashboardData>('/dashboard/manager');
}

export async function getEmpleadoDashboard(): Promise<EmpleadoDashboardData> {
  return get<EmpleadoDashboardData>('/dashboard/empleado');
}

export function getDashboardEndpointForRole(role: UserRole): () => Promise<unknown> {
  switch (role) {
    case 'ADMIN':
      return getAdminDashboard;
    case 'RRHH':
      return getRRHHDashboard;
    case 'MANAGER':
      return getManagerDashboard;
    case 'EMPLEADO':
      return getEmpleadoDashboard;
    default:
      return getEmpleadoDashboard;
  }
}
