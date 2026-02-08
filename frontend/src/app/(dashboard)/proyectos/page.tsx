'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FolderKanban,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Filter,
  LayoutGrid,
  List,
  Calendar,
  Users,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ProyectoForm } from '@/components/forms/proyecto-form';
import {
  useProyectos,
  useDeleteProyecto,
  type Proyecto,
  type ProyectoFilters,
  type ProyectoEstado,
} from '@/hooks/use-proyectos';
import { usePermissions } from '@/hooks/use-permissions';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ESTADOS: { value: ProyectoEstado; label: string }[] = [
  { value: 'PLANIFICACION', label: 'Planificación' },
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'PAUSADO', label: 'Pausado' },
  { value: 'COMPLETADO', label: 'Completado' },
  { value: 'CANCELADO', label: 'Cancelado' },
];
const ESTADO_TODOS_VALUE = '__todos__';

/**
 * Página de listado de proyectos con filtros, vistas y modal de creación.
 * @returns Vista principal de proyectos con opciones de gestión.
 */
export default function ProyectosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canManageProjects } = usePermissions();
  const [filters, setFilters] = useState<ProyectoFilters>({});
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: proyectosData, isLoading, error } = useProyectos(filters);
  const deleteProyecto = useDeleteProyecto();

  const proyectos = proyectosData?.data ?? [];
  const filteredProyectos = proyectos.filter(
    (p) =>
      !search ||
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo.toLowerCase().includes(search.toLowerCase()) ||
      (p.cliente?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  /**
   * Sincroniza el modal de creación cuando se llega desde /proyectos/crear.
   * @returns void
   */
  useEffect(() => {
    const createParam = searchParams.get('crear');
    if (createParam !== '1' && createParam !== 'true') return;
    if (!canManageProjects) {
      router.replace('/proyectos', { scroll: false });
      return;
    }
    setIsCreateOpen(true);
    router.replace('/proyectos', { scroll: false });
  }, [searchParams, router, canManageProjects]);

  /**
   * Actualiza los filtros de proyecto con el valor indicado.
   * @param key - Clave del filtro a actualizar.
   * @param value - Valor del filtro.
   * @returns void
   */
  const handleFilterChange = (key: keyof ProyectoFilters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Elimina un proyecto tras confirmación del usuario.
   * @param id - ID del proyecto.
   * @param nombre - Nombre del proyecto para el mensaje de confirmación.
   * @returns Promesa resuelta cuando finaliza la eliminación.
   */
  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar el proyecto "${nombre}"?`)) return;
    try {
      await deleteProyecto.mutateAsync(id);
      toast.success('Proyecto eliminado');
    } catch {
      toast.error('Error al eliminar proyecto');
    }
  };

  /**
   * Genera el badge de estado según el estado del proyecto.
   * @param estado - Estado actual del proyecto.
   * @returns Componente Badge con el label correspondiente.
   */
  const getEstadoBadge = (estado: ProyectoEstado) => {
    const variant =
      estado === 'ACTIVO'
        ? 'default'
        : estado === 'COMPLETADO'
          ? 'secondary'
          : 'outline';
    const label = ESTADOS.find((e) => e.value === estado)?.label ?? estado;
    return <Badge variant={variant}>{label}</Badge>;
  };

  /**
   * Abre el modal de creación de proyectos.
   * @returns void
   */
  const handleOpenCreate = () => {
    setIsCreateOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Proyectos</h1>
          <p className="text-muted-foreground">Gestiona proyectos y asignaciones</p>
        </div>
        {canManageProjects && (
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Crear proyecto
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, código o cliente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Select
                value={filters.estado ?? ESTADO_TODOS_VALUE}
                onValueChange={(value) =>
                  handleFilterChange(
                    'estado',
                    value === ESTADO_TODOS_VALUE ? undefined : (value as ProyectoEstado)
                  )
                }
              >
                <SelectTrigger className="h-9" aria-label="Estado">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ESTADO_TODOS_VALUE}>Todos los estados</SelectItem>
                  {ESTADOS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('cards')}
                aria-label="Vista tarjetas"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('table')}
                aria-label="Vista tabla"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado de proyectos</CardTitle>
          <CardDescription>
            {filteredProyectos.length > 0
              ? `${filteredProyectos.length} proyecto${filteredProyectos.length !== 1 ? 's' : ''}`
              : 'No hay proyectos'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-red-600">Error al cargar proyectos</p>
              <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
                Reintentar
              </Button>
            </div>
          ) : filteredProyectos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No se encontraron proyectos</p>
              {canManageProjects && (
                <Button
                  onClick={handleOpenCreate}
                  className="mt-4"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear proyecto
                </Button>
              )}
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProyectos.map((p) => (
                <ProyectoCard
                  key={p.id}
                  proyecto={p}
                  canManage={canManageProjects}
                  onView={() => router.push(`/proyectos/${p.id}`)}
                  onEdit={() => router.push(`/proyectos/${p.id}`)}
                  onDelete={() => handleDelete(p.id, p.nombre)}
                  getEstadoBadge={getEstadoBadge}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                      Proyecto
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-700 dark:text-slate-300">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-700 dark:text-slate-300">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProyectos.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{p.nombre}</p>
                          <p className="text-xs text-muted-foreground">{p.codigo}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {p.cliente ?? '—'}
                      </td>
                      <td className="px-4 py-3">{getEstadoBadge(p.estado)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/proyectos/${p.id}`)}
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canManageProjects && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/proyectos/${p.id}`)}
                                title="Editar"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(p.id, p.nombre)}
                                title="Eliminar"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ProyectoForm open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}

/**
 * Renderiza una tarjeta de proyecto con acciones básicas.
 * @param proyecto - Datos del proyecto.
 * @param canManage - Si el usuario puede gestionar proyectos.
 * @param onView - Handler para ver el detalle.
 * @param onEdit - Handler para editar.
 * @param onDelete - Handler para eliminar.
 * @param getEstadoBadge - Función que devuelve el badge de estado.
 * @returns Tarjeta con información y acciones del proyecto.
 */
function ProyectoCard({
  proyecto,
  canManage,
  onView,
  onEdit,
  onDelete,
  getEstadoBadge,
}: {
  proyecto: Proyecto;
  canManage: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getEstadoBadge: (e: ProyectoEstado) => React.ReactNode;
}) {
  const { data: stats } = useProyectoStats(proyecto.id, true);
  const horasConsumidas = proyecto.horasConsumidas ?? 0;
  const horasRestantes =
    proyecto.presupuestoHoras != null
      ? Math.max(proyecto.presupuestoHoras - horasConsumidas, 0)
      : undefined;
  const fechaFinLabel = proyecto.fechaFinEstimada
    ? format(new Date(proyecto.fechaFinEstimada), 'd MMM yyyy', { locale: es })
    : '—';
  const asignacionesLabel =
    stats?.asignacionesActivas != null ? stats.asignacionesActivas : '—';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{proyecto.nombre}</CardTitle>
            <CardDescription>{proyecto.codigo}</CardDescription>
          </div>
          {getEstadoBadge(proyecto.estado)}
        </div>
        {proyecto.cliente && (
          <p className="text-sm text-muted-foreground">Cliente: {proyecto.cliente}</p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="mb-4 grid gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>Fin estimado:</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {fechaFinLabel}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            <span>Horas restantes:</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {horasRestantes != null ? `${horasRestantes.toFixed(1)}h` : '—'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            <span>Empleados asignados:</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {asignacionesLabel}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onView}>
            <Eye className="mr-1 h-4 w-4" />
            Ver
          </Button>
          {canManage && (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
