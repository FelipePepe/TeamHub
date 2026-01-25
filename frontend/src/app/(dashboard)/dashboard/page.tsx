'use client';

import { useAuth } from '@/hooks/use-auth';
import {
  AdminDashboard,
  RRHHDashboard,
  ManagerDashboard,
  EmpleadoDashboard,
} from '@/components/dashboard';

export default function DashboardPage() {
  const { user } = useAuth();

  const getDashboardComponent = () => {
    switch (user?.rol) {
      case 'ADMIN':
        return <AdminDashboard />;
      case 'RRHH':
        return <RRHHDashboard />;
      case 'MANAGER':
        return <ManagerDashboard />;
      case 'EMPLEADO':
      default:
        return <EmpleadoDashboard />;
    }
  };

  const getRolLabel = () => {
    switch (user?.rol) {
      case 'ADMIN':
        return 'Administrador';
      case 'RRHH':
        return 'Recursos Humanos';
      case 'MANAGER':
        return 'Manager';
      case 'EMPLEADO':
      default:
        return 'Empleado';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Bienvenido, {user?.nombre}
        </h1>
        <p className="text-slate-500">
          Panel de {getRolLabel()}
        </p>
      </div>

      {getDashboardComponent()}
    </div>
  );
}
