'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useProyectos,
  useDeleteProyecto,
  type Proyecto,
  type ProyectoFilters,
  type ProyectoEstado,
} from '@/hooks/use-proyectos';
import { usePermissions } from '@/hooks/use-permissions';
import { toast } from 'sonner';

const ESTADOS: { value: ProyectoEstado; label: string }[] = [
  { value: 'PLANIFICACION', label: 'Planificación' },
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'PAUSADO', label: 'Pausado' },
  { value: 'COMPLETADO', label: 'Completado' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

export default function ProyectosPage() {
  const router = useRouter();
  const { canManageProjects } = usePermissions();
  const [filters, setFilters] = useState<ProyectoFilters>({});
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

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

  const handleFilterChange = (key: keyof ProyectoFilters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar el proyecto "${nombre}"?`)) return;
    try {
      await deleteProyecto.mutateAsync(id);
      toast.success('Proyecto eliminado');
    } catch {
      toast.error('Error al eliminar proyecto');
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Proyectos</h1>
          <p className="text-slate-500">Gestiona proyectos y asignaciones</p>
        </div>
        {canManageProjects && (
          <Button onClick={() => router.push('/proyectos/crear')}>
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
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Buscar por nombre, código o cliente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <select
                value={filters.estado ?? ''}
                onChange={(e) =>
                  handleFilterChange(
                    'estado',
                    e.target.value ? (e.target.value as ProyectoEstado) : undefined
                  )
                }
                className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                aria-label="Estado"
              >
                <option value="">Todos los estados</option>
                {ESTADOS.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </select>
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
              <FolderKanban className="mb-4 h-12 w-12 text-slate-400" />
              <p className="text-sm text-slate-500">No se encontraron proyectos</p>
              {canManageProjects && (
                <Button
                  onClick={() => router.push('/proyectos/crear')}
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
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                      Proyecto
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-700">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredProyectos.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-900">{p.nombre}</p>
                          <p className="text-xs text-slate-500">{p.codigo}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
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
    </div>
  );
}

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
          <p className="text-sm text-slate-500">Cliente: {proyecto.cliente}</p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
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
