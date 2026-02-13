'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Users,
  TrendingUp,
  Clock,
  FolderKanban,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KpiCard, BarChart, LineChart } from '@/components/dashboard';
import { getManagerDashboard } from '@/lib/dashboard';
import type { ManagerDashboardData } from '@/types/dashboard';

const LOADING_TEAM_KEYS = ['loading-1', 'loading-2', 'loading-3'] as const;

export function ManagerDashboard() {
  const [data, setData] = useState<ManagerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getManagerDashboard();
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
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Miembros del equipo"
          value={data?.kpis.miembrosEquipo ?? 0}
          icon={Users}
          isLoading={isLoading}
        />
        <KpiCard
          title="Carga promedio"
          value={`${data?.kpis.cargaPromedio ?? 0}%`}
          icon={TrendingUp}
          variant={data?.kpis.cargaPromedio && data.kpis.cargaPromedio > 100 ? 'warning' : 'default'}
          isLoading={isLoading}
        />
        <KpiCard
          title="Horas por aprobar"
          value={data?.kpis.horasPendientesAprobar ?? 0}
          icon={Clock}
          variant={data?.kpis.horasPendientesAprobar ? 'warning' : 'default'}
          isLoading={isLoading}
        />
        <KpiCard
          title="Proyectos activos"
          value={data?.kpis.proyectosActivos ?? 0}
          icon={FolderKanban}
          isLoading={isLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <BarChart
          title="Equipo por proyecto"
          description="Distribucion de asignaciones"
          data={data?.charts.equipoPorProyecto ?? []}
          isLoading={isLoading}
        />
        <LineChart
          title="Horas del equipo"
          description="Ultimos 7 dias"
          data={data?.charts.horasEquipoSemana ?? []}
          isLoading={isLoading}
        />
      </div>

      {/* Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Equipo ocupacion */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ocupacion del equipo</CardTitle>
            <CardDescription>Dedicacion y proyectos por miembro</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {LOADING_TEAM_KEYS.map((key) => (
                  <div key={key} className="animate-pulse h-12 bg-muted rounded" />
                ))}
              </div>
            ) : data?.sections.equipoOcupacion.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay miembros en el equipo
              </p>
            ) : (
              <ul className="space-y-3">
                {data?.sections.equipoOcupacion.map((item) => (
                  <li key={item.usuarioId} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.proyectosActivos} proyecto{item.proyectosActivos !== 1 ? 's' : ''} activo{item.proyectosActivos !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.horasPendientes > 0 && (
                        <Badge variant="outline" className="text-amber-600 dark:text-amber-400">
                          {item.horasPendientes}h pendientes
                        </Badge>
                      )}
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.ocupacion > 100 ? 'bg-red-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min(item.ocupacion, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{item.ocupacion}%</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Pendientes de aprobacion */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Horas pendientes</CardTitle>
              <CardDescription>Registros por aprobar</CardDescription>
            </div>
            {data?.sections.pendientesAprobacion.length ? (
              <Button variant="outline" size="sm">
                Ver todas
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {LOADING_TEAM_KEYS.map((key) => (
                  <div key={key} className="animate-pulse h-12 bg-muted rounded" />
                ))}
              </div>
            ) : data?.sections.pendientesAprobacion.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay horas pendientes de aprobacion
              </p>
            ) : (
              <ul className="space-y-2">
                {data?.sections.pendientesAprobacion.map((item) => (
                  <li key={item.registroId} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.usuarioNombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.proyectoNombre} &middot; {new Date(item.fecha).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </p>
                    </div>
                    <Badge>{item.horas}h</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
