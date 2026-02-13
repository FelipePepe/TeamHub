'use client';

import { useRouter } from 'next/navigation';
import { use } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
  Play,
  Pause,
  Ban,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  useProceso,
  usePausarProceso,
  useReanudarProceso,
  useCancelarProceso,
  useCompletarTarea,
  type EstadoProceso,
  type EstadoTarea,
} from '@/hooks/use-procesos';
import { usePermissions } from '@/hooks/use-permissions';
import { toast } from 'sonner';

/**
 * Página de detalle de un proceso de onboarding
 * Muestra timeline de tareas y permite gestionarlas
 */
export default function ProcesoDetailPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { canCreateOnboarding } = usePermissions();
  const { data: proceso, isLoading, error } = useProceso(resolvedParams.id);
  const pausarProceso = usePausarProceso();
  const reanudarProceso = useReanudarProceso();
  const cancelarProceso = useCancelarProceso();
  const completarTarea = useCompletarTarea();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !proceso) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-red-600" />
        <p className="text-sm text-red-600 mb-4">
          {error ? 'Error al cargar proceso' : 'Proceso no encontrado'}
        </p>
        <Button variant="outline" onClick={() => router.push('/onboarding')}>
          Volver al listado
        </Button>
      </div>
    );
  }

  const progreso = parseFloat(proceso.progreso || '0');
  const tareas = proceso.tareas || [];
  const tareasCompletadas = tareas.filter((t) => t.estado === 'COMPLETADA').length;

  // Manejar pausar
  const handlePausar = async () => {
    try {
      await pausarProceso.mutateAsync(proceso.id);
      toast.success('Proceso pausado correctamente');
    } catch (error) {
      toast.error('Error al pausar proceso');
      console.error(error);
    }
  };

  // Manejar reanudar
  const handleReanudar = async () => {
    try {
      await reanudarProceso.mutateAsync(proceso.id);
      toast.success('Proceso reanudado correctamente');
    } catch (error) {
      toast.error('Error al reanudar proceso');
      console.error(error);
    }
  };

  // Manejar cancelar
  const handleCancelar = async () => {
    if (
      !confirm(
        `¿Estás seguro de que quieres cancelar el proceso de ${proceso.empleadoNombre}?`
      )
    ) {
      return;
    }

    const motivo = prompt('Motivo de cancelación (opcional):');

    try {
      await cancelarProceso.mutateAsync({
        id: proceso.id,
        data: motivo ? { motivo } : {},
      });
      toast.success('Proceso cancelado correctamente');
      router.push('/onboarding');
    } catch (error) {
      toast.error('Error al cancelar proceso');
      console.error(error);
    }
  };

  // Manejar completar tarea
  const handleCompletarTarea = async (tareaId: string, titulo: string) => {
    const notas = prompt(`Notas para la tarea "${titulo}" (opcional):`);

    try {
      await completarTarea.mutateAsync({
        procesoId: proceso.id,
        tareaId,
        data: notas ? { notas } : undefined,
      });
      toast.success('Tarea completada correctamente');
    } catch (error) {
      toast.error('Error al completar tarea');
      console.error(error);
    }
  };

  // Obtener badge de estado del proceso
  const getEstadoBadge = (estado: EstadoProceso) => {
    const styles = {
      EN_CURSO: 'bg-blue-100 text-blue-800',
      COMPLETADO: 'bg-green-100 text-green-800',
      CANCELADO: 'bg-red-100 text-red-800',
      PAUSADO: 'bg-yellow-100 text-yellow-800',
    };

    const labels = {
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

  // Obtener icono y estilo de tarea
  const getTareaIcon = (estado: EstadoTarea) => {
    switch (estado) {
      case 'COMPLETADA':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'EN_PROGRESO':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'BLOQUEADA':
        return <Ban className="h-5 w-5 text-orange-600" />;
      case 'CANCELADA':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTareaEstadoLabel = (estado: EstadoTarea) => {
    const labels = {
      PENDIENTE: 'Pendiente',
      EN_PROGRESO: 'En Progreso',
      COMPLETADA: 'Completada',
      BLOQUEADA: 'Bloqueada',
      CANCELADA: 'Cancelada',
    };
    return labels[estado];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/onboarding')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground">
            Onboarding: {proceso.empleadoNombre}
          </h1>
          <p className="text-muted-foreground">{proceso.plantillaNombre}</p>
        </div>
        {getEstadoBadge(proceso.estado)}
      </div>

      {/* Información del proceso */}
      <Card>
        <CardHeader>
          <CardTitle>Información general</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progreso general</span>
              <span className="font-medium">
                {tareasCompletadas} de {tareas.length} tareas completadas ({Math.round(progreso * 100)}%)
              </span>
            </div>
            <Progress value={progreso * 100} className="h-3" />
          </div>

          {/* Detalles */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Fecha de inicio</p>
              <p className="font-medium">
                {new Date(proceso.fechaInicio).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            {proceso.fechaFinEsperada && (
              <div>
                <p className="text-sm text-muted-foreground">Fecha estimada de finalización</p>
                <p className="font-medium">
                  {new Date(proceso.fechaFinEsperada).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
            {proceso.fechaFinReal && (
              <div>
                <p className="text-sm text-muted-foreground">Fecha real de finalización</p>
                <p className="font-medium">
                  {new Date(proceso.fechaFinReal).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>

          {proceso.notas && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Notas</p>
              <p className="text-sm">{proceso.notas}</p>
            </div>
          )}

          {/* Acciones */}
          {canCreateOnboarding &&
            (proceso.estado === 'EN_CURSO' || proceso.estado === 'PAUSADO') && (
              <div className="flex gap-2 pt-4 border-t">
                {proceso.estado === 'EN_CURSO' && (
                  <Button
                    variant="outline"
                    onClick={handlePausar}
                    disabled={pausarProceso.isPending}
                  >
                    <Pause className="mr-2 h-4 w-4" />
                    Pausar proceso
                  </Button>
                )}
                {proceso.estado === 'PAUSADO' && (
                  <Button
                    variant="outline"
                    onClick={handleReanudar}
                    disabled={reanudarProceso.isPending}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Reanudar proceso
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleCancelar}
                  disabled={cancelarProceso.isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancelar proceso
                </Button>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Timeline de tareas */}
      <Card>
        <CardHeader>
          <CardTitle>Tareas del proceso</CardTitle>
          <CardDescription>
            Sigue el progreso de cada tarea del onboarding
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tareas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay tareas definidas para este proceso
            </p>
          ) : (
            <div className="space-y-4">
              {tareas.map((tarea, index) => {
                const isLastTarea = index === tareas.length - 1;
                const canComplete =
                  canCreateOnboarding &&
                  proceso.estado === 'EN_CURSO' &&
                  tarea.estado === 'PENDIENTE';

                return (
                  <div key={tarea.id} className="flex gap-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      {getTareaIcon(tarea.estado)}
                      {!isLastTarea && (
                        <div className="w-0.5 flex-1 bg-border my-2" />
                      )}
                    </div>

                    {/* Tarea content */}
                    <div className="flex-1 pb-8">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground mb-1">
                            {tarea.titulo}
                          </h4>
                          {tarea.descripcion && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {tarea.descripcion}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 text-xs">
                            <Badge variant="outline">
                              {getTareaEstadoLabel(tarea.estado)}
                            </Badge>
                            <Badge variant="outline">{tarea.categoria}</Badge>
                            <Badge variant="outline">
                              Prioridad: {tarea.prioridad}
                            </Badge>
                            {tarea.duracionEstimadaDias && (
                              <Badge variant="outline">
                                {tarea.duracionEstimadaDias} días
                              </Badge>
                            )}
                          </div>
                          {tarea.notas && (
                            <p className="text-sm text-muted-foreground mt-2 italic">
                              Notas: {tarea.notas}
                            </p>
                          )}
                          {tarea.completadaAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Completada el{' '}
                              {new Date(tarea.completadaAt).toLocaleDateString('es-ES')}
                            </p>
                          )}
                        </div>
                        {canComplete && (
                          <Button
                            size="sm"
                            onClick={() => handleCompletarTarea(tarea.id, tarea.titulo)}
                            disabled={completarTarea.isPending}
                          >
                            Completar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
