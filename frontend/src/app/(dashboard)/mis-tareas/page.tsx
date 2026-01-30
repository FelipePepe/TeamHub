'use client';

import type { CompletarTareaData } from '@/hooks/use-procesos';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  XCircle,
  Filter,
  Search,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useMisTareas,
  useCompletarTarea,
  type EstadoTarea,
  type PrioridadTarea,
} from '@/hooks/use-procesos';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Página de Mis Tareas de Onboarding
 * Muestra todas las tareas asignadas al usuario actual
 */
export default function MisTareasPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoTarea | ''>('');
  const [prioridadFilter, setPrioridadFilter] = useState<PrioridadTarea | ''>('');
  const [completingTarea, setCompletingTarea] = useState<string | null>(null);
  const [notas, setNotas] = useState('');
  const [evidenciaUrl, setEvidenciaUrl] = useState('');

  const { data: tareasData, isLoading, error } = useMisTareas();
  const completarTarea = useCompletarTarea();

  const tareas = tareasData?.data ?? [];

  // Filtrado local
  const filteredTareas = tareas.filter((tarea) => {
    const matchSearch =
      tarea.titulo.toLowerCase().includes(search.toLowerCase()) ||
      tarea.descripcion?.toLowerCase().includes(search.toLowerCase());
    const matchEstado = estadoFilter === '' || tarea.estado === estadoFilter;
    const matchPrioridad = prioridadFilter === '' || tarea.prioridad === prioridadFilter;

    return matchSearch && matchEstado && matchPrioridad;
  });

  // Ordenar: pendientes primero, luego por prioridad
  const sortedTareas = [...filteredTareas].sort((a, b) => {
    const estadoOrder = {
      PENDIENTE: 0,
      EN_PROGRESO: 1,
      BLOQUEADA: 2,
      COMPLETADA: 3,
      CANCELADA: 4,
    };

    const prioridadOrder = {
      URGENTE: 0,
      ALTA: 1,
      MEDIA: 2,
      BAJA: 3,
    };

    if (estadoOrder[a.estado] !== estadoOrder[b.estado]) {
      return estadoOrder[a.estado] - estadoOrder[b.estado];
    }

    return prioridadOrder[a.prioridad] - prioridadOrder[b.prioridad];
  });

  // Manejar completar tarea
  const handleCompletar = async () => {
    if (!completingTarea) return;

    try {
      await completarTarea.mutateAsync({
        procesoId: tareas.find((t) => t.id === completingTarea)!.procesoId,
        tareaId: completingTarea,
        notas: notas || undefined,
        evidenciaUrl: evidenciaUrl || undefined,
      } as unknown as { procesoId: string; tareaId: string; data?: CompletarTareaData });

      toast.success('Tarea completada correctamente');
      setCompletingTarea(null);
      setNotas('');
      setEvidenciaUrl('');
    } catch (error) {
      console.error('Error completing tarea:', error);
      toast.error('Error al completar la tarea');
    }
  };

  // Get estado icon
  const getEstadoIcon = (estado: EstadoTarea) => {
    const icons = {
      PENDIENTE: <Circle className="h-5 w-5 text-slate-400" />,
      EN_PROGRESO: <Clock className="h-5 w-5 text-blue-500" />,
      COMPLETADA: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      BLOQUEADA: <AlertCircle className="h-5 w-5 text-orange-500" />,
      CANCELADA: <XCircle className="h-5 w-5 text-red-500" />,
    };
    return icons[estado];
  };

  // Get estado badge
  const getEstadoBadge = (estado: EstadoTarea) => {
    const styles = {
      PENDIENTE: 'bg-slate-100 text-slate-800',
      EN_PROGRESO: 'bg-blue-100 text-blue-800',
      COMPLETADA: 'bg-green-100 text-green-800',
      BLOQUEADA: 'bg-orange-100 text-orange-800',
      CANCELADA: 'bg-red-100 text-red-800',
    };

    const labels = {
      PENDIENTE: 'Pendiente',
      EN_PROGRESO: 'En Progreso',
      COMPLETADA: 'Completada',
      BLOQUEADA: 'Bloqueada',
      CANCELADA: 'Cancelada',
    };

    return (
      <Badge variant="secondary" className={styles[estado]}>
        {labels[estado]}
      </Badge>
    );
  };

  // Get prioridad badge
  const getPrioridadBadge = (prioridad: PrioridadTarea) => {
    const styles = {
      URGENTE: 'bg-red-100 text-red-800',
      ALTA: 'bg-orange-100 text-orange-800',
      MEDIA: 'bg-yellow-100 text-yellow-800',
      BAJA: 'bg-green-100 text-green-800',
    };

    return (
      <Badge variant="outline" className={styles[prioridad]}>
        {prioridad}
      </Badge>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>No se pudieron cargar las tareas</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const tareaPendientesCount = tareas.filter(
    (t) => t.estado === 'PENDIENTE' || t.estado === 'EN_PROGRESO'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Mis Tareas de Onboarding</h1>
        <p className="text-slate-500">
          Gestiona las tareas asignadas a ti en los procesos de onboarding
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Tareas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tareas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {tareaPendientesCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Completadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tareas.filter((t) => t.estado === 'COMPLETADA').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {tareas.filter((t) => t.prioridad === 'URGENTE' && t.estado === 'PENDIENTE').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar tareas..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Estado */}
            <select
              value={estadoFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEstadoFilter(e.target.value as EstadoTarea | '')}
              className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
            >
              <option value="">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_PROGRESO">En Progreso</option>
              <option value="COMPLETADA">Completada</option>
              <option value="BLOQUEADA">Bloqueada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>

            {/* Prioridad */}
            <select
              value={prioridadFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPrioridadFilter(e.target.value as PrioridadTarea | '')}
              className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
            >
              <option value="">Todas las prioridades</option>
              <option value="URGENTE">Urgente</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tareas List */}
      <Card>
        <CardHeader>
          <CardTitle>Tareas ({sortedTareas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedTareas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No hay tareas que coincidan con los filtros</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTareas.map((tarea) => (
                <Card key={tarea.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="mt-1">{getEstadoIcon(tarea.estado)}</div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-medium text-slate-900">{tarea.titulo}</h3>
                        <div className="flex gap-2">
                          {getEstadoBadge(tarea.estado)}
                          {getPrioridadBadge(tarea.prioridad)}
                        </div>
                      </div>

                      {tarea.descripcion && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {tarea.descripcion}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                        {tarea.categoria && (
                          <span className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {tarea.categoria}
                            </Badge>
                          </span>
                        )}
                        <span>Orden: #{tarea.orden}</span>
                        {tarea.completadaAt && (
                          <span>
                            Completada:{' '}
                            {format(new Date(tarea.completadaAt), 'PPP', { locale: es })}
                          </span>
                        )}
                      </div>

                      {/* Notas */}
                      {tarea.notas && (
                        <div className="rounded-md bg-muted p-3 text-sm mt-2">
                          <p className="font-medium mb-1">Notas:</p>
                          <p className="text-muted-foreground">{tarea.notas}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/onboarding/${tarea.procesoId}`)
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Proceso
                        </Button>

                        {tarea.estado === 'PENDIENTE' && (
                          <Button
                            size="sm"
                            onClick={() => setCompletingTarea(tarea.id)}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Completar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completar Tarea Modal */}
      <Dialog
        open={!!completingTarea}
        onOpenChange={(open) => {
          if (!open) {
            setCompletingTarea(null);
            setNotas('');
            setEvidenciaUrl('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Completar Tarea</DialogTitle>
            <DialogDescription>
              Añade notas opcionales y evidencia de la tarea completada
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Notas */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas (opcional)</label>
              <Textarea
                value={notas}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNotas(e.target.value)}
                placeholder="Añade notas sobre cómo se completó la tarea..."
                rows={4}
              />
            </div>

            {/* Evidencia URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium">URL Evidencia (opcional)</label>
              <Input
                type="url"
                value={evidenciaUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEvidenciaUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCompletingTarea(null);
                setNotas('');
                setEvidenciaUrl('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCompletar}
              disabled={completarTarea.isPending}
            >
              {completarTarea.isPending ? 'Completando...' : 'Completar Tarea'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
