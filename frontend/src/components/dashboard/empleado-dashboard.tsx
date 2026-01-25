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
import { getEmpleadoDashboard } from '@/lib/dashboard';
import type { EmpleadoDashboardData } from '@/types/dashboard';

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
          <Link href="/onboarding/mis-tareas">
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
        {/* Mi onboarding */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mi onboarding</CardTitle>
            <CardDescription>Tu progreso de incorporacion</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <div className="animate-pulse h-4 bg-slate-100 rounded w-full" />
                <div className="animate-pulse h-20 bg-slate-100 rounded" />
              </div>
            ) : (
              <>
                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-500">Progreso</span>
                    <span className="text-sm font-medium">{data?.sections.onboarding.progreso ?? 0}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${data?.sections.onboarding.progreso ?? 0}%` }}
                    />
                  </div>
                </div>

                {/* Proximas tareas */}
                {data?.sections.onboarding.proximasTareas.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">
                    No tienes tareas de onboarding pendientes
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {data?.sections.onboarding.proximasTareas.slice(0, 3).map((tarea) => (
                      <li key={tarea.tareaId} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm truncate">{tarea.titulo}</span>
                        {tarea.fechaLimite && (
                          <Badge variant="outline" className="text-xs">
                            {new Date(tarea.fechaLimite).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </CardContent>
        </Card>

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
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse h-12 bg-slate-100 rounded" />
                ))}
              </div>
            ) : data?.sections.misProyectos.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                No tienes proyectos asignados
              </p>
            ) : (
              <ul className="space-y-2">
                {data?.sections.misProyectos.map((proyecto) => (
                  <li key={proyecto.proyectoId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{proyecto.nombre}</p>
                      {proyecto.rol && (
                        <p className="text-xs text-slate-400">{proyecto.rol}</p>
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
