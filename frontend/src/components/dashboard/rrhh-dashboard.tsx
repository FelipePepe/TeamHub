'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  ClipboardList,
  CheckCircle,
  Timer,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KpiCard, BarChart, LineChart, AlertList } from '@/components/dashboard';
import { getRRHHDashboard } from '@/lib/dashboard';
import type { RRHHDashboardData } from '@/types/dashboard';

/**
 * Renderiza el dashboard para RRHH con KPIs, gráficos y alertas.
 * @returns Vista completa del dashboard para el rol RRHH.
 */
export function RRHHDashboard() {
  const [data, setData] = useState<RRHHDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getRRHHDashboard();
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Onboardings en curso"
          value={data?.kpis.onboardingsEnCurso ?? 0}
          icon={ClipboardList}
          isLoading={isLoading}
        />
        <KpiCard
          title="Completados este mes"
          value={data?.kpis.completadosMes ?? 0}
          icon={CheckCircle}
          variant="success"
          isLoading={isLoading}
        />
        <KpiCard
          title="Tiempo medio (dias)"
          value={Math.round(data?.kpis.tiempoMedioOnboardingDias ?? 0)}
          icon={Timer}
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
          title="Empleados por departamento"
          data={data?.charts.empleadosPorDepartamento ?? []}
          isLoading={isLoading}
        />
        <LineChart
          title="Evolucion de altas"
          description="Nuevos empleados por mes"
          data={data?.charts.evolucionAltas ?? []}
          isLoading={isLoading}
          formatLabel={(fecha) => {
            const date = new Date(fecha);
            return date.toLocaleDateString('es-ES', { month: 'short' });
          }}
        />
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Onboardings en curso */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Onboardings en curso</CardTitle>
            <CardDescription>Procesos activos con su progreso</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse h-12 bg-muted rounded" />
                ))}
              </div>
            ) : data?.sections.onboardingsEnCurso.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay onboardings en curso
              </p>
            ) : (
              <ul className="space-y-3">
                {data?.sections.onboardingsEnCurso.map((item) => (
                  <li key={item.procesoId} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.empleadoNombre}</p>
                      <p className="text-xs text-muted-foreground">
                        Inicio: {new Date(item.fechaInicio).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${item.progreso}%` }}
                        />
                      </div>
                      <Badge variant="outline">{item.progreso}%</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Alertas */}
        <AlertList
          title="Alertas"
          description="Tareas vencidas o estancadas"
          items={data?.sections.alertas ?? []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
