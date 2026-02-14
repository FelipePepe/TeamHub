import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AdminDashboard } from '../admin-dashboard';
import { ManagerDashboard } from '../manager-dashboard';
import { EmpleadoDashboard } from '../empleado-dashboard';
import { RRHHDashboard } from '../rrhh-dashboard';

const dashboardMocks = vi.hoisted(() => ({
  getAdminDashboard: vi.fn(),
  getManagerDashboard: vi.fn(),
  getEmpleadoDashboard: vi.fn(),
  getRRHHDashboard: vi.fn(),
}));

const permissionMocks = vi.hoisted(() => ({
  isAdmin: true,
}));

const toastMocks = vi.hoisted(() => ({
  error: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: toastMocks,
}));

vi.mock('@/lib/dashboard', () => ({
  getAdminDashboard: dashboardMocks.getAdminDashboard,
  getManagerDashboard: dashboardMocks.getManagerDashboard,
  getEmpleadoDashboard: dashboardMocks.getEmpleadoDashboard,
  getRRHHDashboard: dashboardMocks.getRRHHDashboard,
}));

vi.mock('@/hooks/use-permissions', () => ({
  usePermissions: () => ({ isAdmin: permissionMocks.isAdmin }),
}));

vi.mock('@/components/dashboard', () => ({
  KpiCard: ({ title, value }: { title: string; value: string | number }) => <div>{title}:{value}</div>,
  BarChart: ({ title }: { title: string }) => <div>Bar:{title}</div>,
  LineChart: ({ title }: { title: string }) => <div>Line:{title}</div>,
  ActivityList: ({ title }: { title: string }) => <div>Activity:{title}</div>,
  AlertList: ({ title }: { title: string }) => <div>Alert:{title}</div>,
}));

vi.mock('@/components/onboarding/mi-onboarding-widget', () => ({
  MiOnboardingWidget: () => <div>MiOnboardingWidget</div>,
}));

describe('Role dashboards', () => {
  beforeEach(() => {
    dashboardMocks.getAdminDashboard.mockReset();
    dashboardMocks.getManagerDashboard.mockReset();
    dashboardMocks.getEmpleadoDashboard.mockReset();
    dashboardMocks.getRRHHDashboard.mockReset();
    toastMocks.error.mockReset();
    permissionMocks.isAdmin = true;
  });

  it('admin dashboard renderiza datos y oculta actividad cuando no es admin', async () => {
    dashboardMocks.getAdminDashboard.mockResolvedValue({
      kpis: {
        usuariosActivos: 10,
        altasMes: 3,
        proyectosActivos: 2,
        horasMes: 120,
        onboardingsEnCurso: 1,
        tareasVencidas: 0,
      },
      charts: {
        usuariosPorRol: [],
        usuariosPorDepartamento: [],
        proyectosPorEstado: [],
        horasPorEstado: [],
      },
      listas: { actividadReciente: [], alertasCriticas: [] },
    });

    const { rerender } = render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Usuarios activos:10')).toBeInTheDocument();
      expect(screen.getByText('Activity:Actividad reciente')).toBeInTheDocument();
    });

    permissionMocks.isAdmin = false;
    rerender(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Activity:Actividad reciente')).not.toBeInTheDocument();
      expect(screen.getByText('Alert:Alertas criticas')).toBeInTheDocument();
    });
  });

  it('dashboards de manager, empleado y rrhh renderizan secciones principales', async () => {
    dashboardMocks.getManagerDashboard.mockResolvedValue({
      kpis: { miembrosEquipo: 4, cargaPromedio: 80, horasPendientesAprobar: 2, proyectosActivos: 3 },
      charts: { equipoPorProyecto: [], horasEquipoSemana: [] },
      sections: { equipoOcupacion: [], pendientesAprobacion: [] },
    });
    dashboardMocks.getEmpleadoDashboard.mockResolvedValue({
      kpis: { horasMes: 12, proyectosActivos: 2, ocupacion: 65, tareasPendientes: 1 },
      charts: { horasPorEstado: [], horasPorSemana: [] },
      sections: { misProyectos: [] },
    });
    dashboardMocks.getRRHHDashboard.mockResolvedValue({
      kpis: { onboardingsEnCurso: 1, completadosMes: 2, tiempoMedioOnboardingDias: 10, tareasVencidas: 0 },
      charts: { empleadosPorDepartamento: [], evolucionAltas: [] },
      sections: { onboardingsEnCurso: [], alertas: [] },
    });

    render(
      <div>
        <ManagerDashboard />
        <EmpleadoDashboard />
        <RRHHDashboard />
      </div>
    );

    await waitFor(() => {
      expect(screen.getByText('Miembros del equipo:4')).toBeInTheDocument();
      expect(screen.getByText('Horas del mes:12')).toBeInTheDocument();
      expect(screen.getByText('Onboardings en curso:1')).toBeInTheDocument();
      expect(screen.getByText('MiOnboardingWidget')).toBeInTheDocument();
    });
  });

  it('muestra toast cuando falla carga de dashboard', async () => {
    dashboardMocks.getAdminDashboard.mockRejectedValue(new Error('db down'));

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(toastMocks.error).toHaveBeenCalledWith('Error al cargar el dashboard');
    });
  });
});
