'use client';

import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useProcesos, useMisTareas } from '@/hooks/use-procesos';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Widget Mi Onboarding para Dashboard Empleado
 * Muestra el progreso del proceso de onboarding del usuario actual
 */
export function MiOnboardingWidget() {
  const router = useRouter();
  const { user } = useAuth();

  // Obtener proceso de onboarding del usuario actual
  const { data: procesosData, isLoading: loadingProcesos } = useProcesos({
    empleadoId: user?.id,
  });

  // Obtener tareas pendientes
  const { data: tareasData, isLoading: loadingTareas } = useMisTareas();

  const proceso = procesosData?.data?.[0]; // Primer proceso activo del usuario
  const tareas = tareasData?.data ?? [];

  // Tareas pendientes ordenadas por orden
  const tareasPendientes = tareas
    .filter((t) => t.estado === 'PENDIENTE')
    .sort((a, b) => a.orden - b.orden)
    .slice(0, 3);

  const isLoading = loadingProcesos || loadingTareas;

  // Calculate progress from proceso.progreso (formato "5/10")
  const getProgressPercentage = (progreso?: string) => {
    if (!progreso) return 0;
    const [completed, total] = progreso.split('/').map(Number);
    if (!total) return 0;
    return Math.round((completed / total) * 100);
  };

  const progressPercentage = getProgressPercentage(proceso?.progreso);

  // Get estado badge
  const getEstadoBadge = (estado: string) => {
    const styles: Record<string, string> = {
      EN_CURSO: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200',
      COMPLETADO: 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200',
      CANCELADO: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200',
      PAUSADO: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-200',
    };

    const labels: Record<string, string> = {
      EN_CURSO: 'En Curso',
      COMPLETADO: 'Completado',
      CANCELADO: 'Cancelado',
      PAUSADO: 'Pausado',
    };

    return (
      <Badge variant="secondary" className={styles[estado]}>
        {labels[estado]}
      </Badge>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mi Onboarding</CardTitle>
          <CardDescription>Tu proceso de incorporación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // No proceso
  if (!proceso) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mi Onboarding</CardTitle>
          <CardDescription>Tu proceso de incorporación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">
              No tienes un proceso de onboarding activo
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Mi Onboarding</CardTitle>
            <CardDescription>{proceso.plantillaNombre}</CardDescription>
          </div>
          {getEstadoBadge(proceso.estado)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Progreso</span>
            <span className="text-sm font-medium">{proceso.progreso}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Inicio:</span>
            <span className="font-medium">
              {format(new Date(proceso.fechaInicio), 'PPP', { locale: es })}
            </span>
          </div>
          {proceso.fechaFinEsperada && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Fin esperado:</span>
              <span className="font-medium">
                {format(new Date(proceso.fechaFinEsperada), 'PPP', { locale: es })}
              </span>
            </div>
          )}
        </div>

        {/* Próximas tareas */}
        {tareasPendientes.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Próximas tareas</h4>
            <ul className="space-y-2">
              {tareasPendientes.map((tarea) => (
                <li
                  key={tarea.id}
                  className="flex items-start gap-2 p-2 rounded-md hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => router.push(`/onboarding/${proceso.id}`)}
                >
                  <Circle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tarea.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {tarea.categoria}
                    </p>
                  </div>
                  {tarea.prioridad === 'URGENTE' && (
                    <Badge variant="outline" className="text-xs bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300">
                      Urgente
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => router.push(`/onboarding/${proceso.id}`)}
          >
            Ver Detalle
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          {tareasPendientes.length > 0 && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => router.push('/mis-tareas')}
            >
              Mis Tareas
            </Button>
          )}
        </div>

        {/* Completed state */}
        {proceso.estado === 'COMPLETADO' && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-medium">
              ¡Onboarding completado! 🎉
            </span>
          </div>
        )}

        {/* Paused state */}
        {proceso.estado === 'PAUSADO' && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">
              El proceso está pausado temporalmente
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
