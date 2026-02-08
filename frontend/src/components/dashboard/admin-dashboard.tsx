'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Users,
  UserPlus,
  FolderKanban,
  Clock,
  ClipboardList,
  AlertTriangle,
} from 'lucide-react';
import { KpiCard, BarChart, ActivityList, AlertList } from '@/components/dashboard';
import { getAdminDashboard } from '@/lib/dashboard';
import { usePermissions } from '@/hooks/use-permissions';
import type { AdminDashboardData } from '@/types/dashboard';

/**
 * Renderiza el dashboard de administración con KPIs, gráficas y listados.
 * @returns Vista principal del dashboard para administradores.
 */
export function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin } = usePermissions();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getAdminDashboard();
        setData(result);
      } catch (error) {
        toast.error('Error al cargar el dashboard');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          title="Usuarios activos"
          value={data?.kpis.usuariosActivos ?? 0}
          icon={Users}
          isLoading={isLoading}
        />
        <KpiCard
          title="Altas del mes"
          value={data?.kpis.altasMes ?? 0}
          icon={UserPlus}
          variant="success"
          isLoading={isLoading}
        />
        <KpiCard
          title="Proyectos activos"
          value={data?.kpis.proyectosActivos ?? 0}
          icon={FolderKanban}
          isLoading={isLoading}
        />
        <KpiCard
          title="Horas del mes"
          value={data?.kpis.horasMes ?? 0}
          icon={Clock}
          isLoading={isLoading}
        />
        <KpiCard
          title="Onboardings"
          value={data?.kpis.onboardingsEnCurso ?? 0}
          icon={ClipboardList}
          isLoading={isLoading}
        />
        <KpiCard
          title="Tareas vencidas"
          value={data?.kpis.tareasVencidas ?? 0}
          icon={AlertTriangle}
          variant={data?.kpis.tareasVencidas ? 'danger' : 'default'}
          isLoading={isLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <BarChart
          title="Usuarios por rol"
          data={data?.charts.usuariosPorRol ?? []}
          isLoading={isLoading}
        />
        <BarChart
          title="Usuarios por departamento"
          data={data?.charts.usuariosPorDepartamento ?? []}
          isLoading={isLoading}
        />
        <BarChart
          title="Proyectos por estado"
          data={data?.charts.proyectosPorEstado ?? []}
          isLoading={isLoading}
        />
        <BarChart
          title="Horas por estado"
          data={data?.charts.horasPorEstado ?? []}
          isLoading={isLoading}
        />
      </div>

      {/* Lists */}
      <div className={`grid grid-cols-1 gap-4 md:gap-6 ${isAdmin ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
        {isAdmin && (
          <ActivityList
            title="Actividad reciente"
            items={data?.listas.actividadReciente ?? []}
            isLoading={isLoading}
          />
        )}
        <AlertList
          title="Alertas criticas"
          items={data?.listas.alertasCriticas ?? []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
