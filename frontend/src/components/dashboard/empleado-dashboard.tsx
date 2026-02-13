'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Clock,
  FolderKanban,
  TrendingUp,
  ListChecks,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KpiCard, BarChart, LineChart } from '@/components/dashboard';
import { MiOnboardingWidget } from '@/components/onboarding/mi-onboarding-widget';
import { getEmpleadoDashboard } from '@/lib/dashboard';
import type { EmpleadoDashboardData } from '@/types/dashboard';

const LOADING_PROJECT_KEYS = ['loading-1', 'loading-2', 'loading-3'] as const;

/**
 * Renderiza el dashboard del empleado con KPIs, acciones rápidas y módulos clave.
 * @returns Vista completa del dashboard para el rol EMPLEADO.
 */
export function EmpleadoDashboard() {
  const [data, setData] = useState<EmpleadoDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getEmpleadoDashboard();
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
          title="Horas del mes"
          value={data?.kpis.horasMes ?? 0}
          icon={Clock}
          isLoading={isLoading}
        />
        <KpiCard
          title="Proyectos activos"
          value={data?.kpis.proyectosActivos ?? 0}
          icon={FolderKanban}
          isLoading={isLoading}
        />
        <KpiCard
          title="Mi ocupacion"
          value={`${data?.kpis.ocupacion ?? 0}%`}
          icon={TrendingUp}
          variant={data?.kpis.ocupacion && data.kpis.ocupacion > 100 ? 'warning' : 'default'}
          isLoading={isLoading}
        />
        <KpiCard
          title="Tareas pendientes"
          value={data?.kpis.tareasPendientes ?? 0}
          icon={ListChecks}
          variant={data?.kpis.tareasPendientes ? 'warning' : 'default'}
          isLoading={isLoading}
        />
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/timetracking">
            <Plus className="h-4 w-4 mr-2" />
            Imputar horas
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/mis-tareas">
            Ver mis tareas
          </Link>
        </Button>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <BarChart
          title="Horas por estado"
          description="Este mes"
          data={data?.charts.horasPorEstado ?? []}
          isLoading={isLoading}
        />
        <LineChart
          title="Horas por semana"
          description="Ultimos 7 dias"
          data={data?.charts.horasPorSemana ?? []}
          isLoading={isLoading}
        />
      </div>

      {/* Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Mi onboarding - New Widget */}
        <MiOnboardingWidget />

        {/* Mis proyectos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Mis proyectos</CardTitle>
              <CardDescription>Proyectos asignados</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/proyectos">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {LOADING_PROJECT_KEYS.map((key) => (
                  <div key={key} className="animate-pulse h-12 bg-muted rounded" />
                ))}
              </div>
            ) : data?.sections.misProyectos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tienes proyectos asignados
              </p>
            ) : (
              <ul className="space-y-2">
                {data?.sections.misProyectos.map((proyecto) => (
                  <li key={proyecto.proyectoId} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">{proyecto.nombre}</p>
                      {proyecto.rol && (
                        <p className="text-xs text-muted-foreground">{proyecto.rol}</p>
                      )}
                    </div>
                    <Badge variant="outline">{proyecto.dedicacionPorcentaje}%</Badge>
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
