'use client';
import type { Departamento } from '@/types';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  Plus,
  Search,
  Eye,
  Filter,
  Pause,
  Play,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  useProcesos,
  usePausarProceso,
  useReanudarProceso,
  useCancelarProceso,
  type ProcesoFilters,
  type EstadoProceso,
} from '@/hooks/use-procesos';
import { useDepartamentos } from '@/hooks/use-departamentos';
import { useEmpleados } from '@/hooks/use-empleados';
import { usePermissions } from '@/hooks/use-permissions';
import { IniciarProcesoModal } from '@/components/onboarding/iniciar-proceso-modal';
import { toast } from 'sonner';

/**
 * Página de listado de procesos de onboarding
 * Permite ver, filtrar y gestionar procesos en curso
 */
export default function ProcesosPage() {
  const router = useRouter();
  const { canCreateOnboarding, canViewAllOnboardings } = usePermissions();
  const [filters, setFilters] = useState<ProcesoFilters>({});
  const [search, setSearch] = useState('');
  const [showIniciarModal, setShowIniciarModal] = useState(false);

  const { data: procesosData, isLoading, error } = useProcesos(filters);
  const { data: departamentosData } = useDepartamentos();
  const { data: empleadosData } = useEmpleados();
  const pausarProceso = usePausarProceso();
  const reanudarProceso = useReanudarProceso();
  const cancelarProceso = useCancelarProceso();

  const procesos = procesosData?.data ?? [];
  const departamentos = departamentosData?.data ?? [];
  const empleados = empleadosData?.data ?? [];

  // Verificar permisos - cualquier usuario puede ver su onboarding
  // Solo ADMIN/RRHH pueden ver todos
  const canView = canViewAllOnboardings || true; // Todos pueden ver al menos el suyo
  
  if (!canView) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acceso denegado</CardTitle>
            <CardDescription>
              No tienes permisos para acceder a esta página
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Filtrar procesos localmente por nombre de empleado
  const filteredProcesos = procesos.filter((proceso) =>
    proceso.empleadoNombre?.toLowerCase().includes(search.toLowerCase())
  );

  // Manejar búsqueda
  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  // Manejar filtros
  const handleFilterChange = (key: keyof ProcesoFilters, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Manejar pausar
  const handlePausar = async (id: string, nombre: string) => {
    try {
      await pausarProceso.mutateAsync(id);
      toast.success(`Proceso de ${nombre} pausado correctamente`);
    } catch (error) {
      toast.error('Error al pausar proceso');
      console.error(error);
    }
  };

  // Manejar reanudar
  const handleReanudar = async (id: string, nombre: string) => {
    try {
      await reanudarProceso.mutateAsync(id);
      toast.success(`Proceso de ${nombre} reanudado correctamente`);
    } catch (error) {
      toast.error('Error al reanudar proceso');
      console.error(error);
    }
  };

  // Manejar cancelar
  const handleCancelar = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de que quieres cancelar el proceso de ${nombre}?`)) {
      return;
    }

    const motivo = prompt('Motivo de cancelación (opcional):');

    try {
      await cancelarProceso.mutateAsync({
        id,
        data: motivo ? { motivo } : {},
      });
      toast.success(`Proceso de ${nombre} cancelado correctamente`);
    } catch (error) {
      toast.error('Error al cancelar proceso');
      console.error(error);
    }
  };

  // Obtener badge de estado
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Procesos de Onboarding
          </h1>
          <p className="text-slate-500">
            Gestiona los procesos de incorporación de nuevos empleados
          </p>
        </div>
        {canCreateOnboarding && (
          <Button onClick={() => setShowIniciarModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Iniciar proceso
          </Button>
        )}
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
          <div className="grid gap-4 md:grid-cols-4">
            {/* Búsqueda */}
            <div className="md:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Buscar por empleado..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Filtro por estado */}
            <div>
              <select
                value={filters.estado ?? ''}
                onChange={(e) =>
                  handleFilterChange('estado', e.target.value || undefined)
                }
                className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
              >
                <option value="">Todos los estados</option>
                <option value="EN_CURSO">En Curso</option>
                <option value="PAUSADO">Pausado</option>
                <option value="COMPLETADO">Completado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>

            {/* Filtro por empleado */}
            <div>
              <select
                value={filters.empleadoId ?? ''}
                onChange={(e) =>
                  handleFilterChange('empleadoId', e.target.value || undefined)
                }
                className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
              >
                <option value="">Todos los empleados</option>
                {empleados.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre} {emp.apellidos}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por departamento */}
            <div>
              <select
                value={filters.departamentoId ?? ''}
                onChange={(e) =>
                  handleFilterChange('departamentoId', e.target.value || undefined)
                }
                className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
              >
                <option value="">Todos los departamentos</option>
                {departamentos.map((dept: Departamento) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de procesos */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de procesos</CardTitle>
          <CardDescription>
            {filteredProcesos.length > 0
              ? `${filteredProcesos.length} proceso${filteredProcesos.length !== 1 ? 's' : ''} encontrado${filteredProcesos.length !== 1 ? 's' : ''}`
              : 'No hay procesos'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-red-600">Error al cargar procesos</p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="mt-4"
              >
                Reintentar
              </Button>
            </div>
          ) : filteredProcesos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="mb-4 h-12 w-12 text-slate-400" />
              <p className="text-sm text-slate-500">
                {search || filters.estado || filters.empleadoId || filters.departamentoId
                  ? 'No se encontraron procesos con los filtros seleccionados'
                  : 'No hay procesos iniciados. Inicia tu primer proceso de onboarding.'}
              </p>
              {canCreateOnboarding &&
                !search &&
                !filters.estado &&
                !filters.empleadoId &&
                !filters.departamentoId && (
                  <Button
                    onClick={() => router.push('/onboarding/iniciar')}
                    className="mt-4"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Iniciar primer proceso
                  </Button>
                )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProcesos.map((proceso) => {
                const progreso = parseFloat(proceso.progreso || '0');
                const mostrarAcciones =
                  canCreateOnboarding &&
                  (proceso.estado === 'EN_CURSO' || proceso.estado === 'PAUSADO');

                return (
                  <Card
                    key={proceso.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/onboarding/${proceso.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base mb-1">
                            {proceso.empleadoNombre || 'Empleado'}
                          </CardTitle>
                          <CardDescription className="flex flex-wrap gap-2 items-center">
                            <span>{proceso.plantillaNombre || 'Plantilla'}</span>
                            <span className="text-slate-400">•</span>
                            <span>
                              Inicio:{' '}
                              {new Date(proceso.fechaInicio).toLocaleDateString('es-ES')}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {getEstadoBadge(proceso.estado)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Progress bar */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Progreso</span>
                          <span className="font-medium">{Math.round(progreso * 100)}%</span>
                        </div>
                        <Progress value={progreso * 100} className="h-2" />
                      </div>

                      {/* Acciones */}
                      {mostrarAcciones && (
                        <div
                          className="flex gap-2 pt-4 border-t"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/onboarding/${proceso.id}`);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalle
                          </Button>

                          {proceso.estado === 'EN_CURSO' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePausar(proceso.id, proceso.empleadoNombre || '');
                              }}
                              disabled={pausarProceso.isPending}
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          )}

                          {proceso.estado === 'PAUSADO' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReanudar(proceso.id, proceso.empleadoNombre || '');
                              }}
                              disabled={reanudarProceso.isPending}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelar(proceso.id, proceso.empleadoNombre || '');
                            }}
                            disabled={cancelarProceso.isPending}
                          >
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Iniciar Proceso */}
      <IniciarProcesoModal
        open={showIniciarModal}
        onOpenChange={setShowIniciarModal}
        onSuccess={(procesoId) => {
          router.push(`/onboarding/${procesoId}`);
        }}
      />
    </div>
  );
}
