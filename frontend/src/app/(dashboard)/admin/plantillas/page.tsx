'use client';
import type { Departamento } from '@/types';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Filter,
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
import {
  usePlantillas,
  useDeletePlantilla,
  useDuplicatePlantilla,
  type PlantillaFilters,
} from '@/hooks/use-plantillas';
import { useDepartamentos } from '@/hooks/use-departamentos';
import { usePermissions } from '@/hooks/use-permissions';
import { toast } from 'sonner';

const FILTRO_TODOS_VALUE = '__todos__';

/**
 * Página de listado de plantillas de onboarding para administradores y RRHH
 * Permite ver, filtrar, buscar y gestionar plantillas
 */
export default function PlantillasPage() {
  const router = useRouter();
  const { canManageTemplates } = usePermissions();
  const [filters, setFilters] = useState<PlantillaFilters>({
    activo: true,
  });
  const [search, setSearch] = useState('');

  const { data: plantillasData, isLoading, error } = usePlantillas(filters);
  const { data: departamentosData } = useDepartamentos();
  const deletePlantilla = useDeletePlantilla();
  const duplicatePlantilla = useDuplicatePlantilla();

  const plantillas = plantillasData?.plantillas ?? [];
  const departamentos = departamentosData?.data ?? [];

  // Verificar permisos
  if (!canManageTemplates) {
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

  // Manejar búsqueda con filtro local
  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  // Filtrar plantillas localmente por nombre
  const filteredPlantillas = plantillas.filter((plantilla) =>
    plantilla.nombre.toLowerCase().includes(search.toLowerCase())
  );

  // Manejar filtros
  const handleFilterChange = (key: keyof PlantillaFilters, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Manejar eliminación
  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la plantilla "${nombre}"?`)) {
      return;
    }

    try {
      await deletePlantilla.mutateAsync(id);
      toast.success('Plantilla eliminada correctamente');
    } catch (error) {
      toast.error('Error al eliminar plantilla');
      console.error(error);
    }
  };

  // Manejar duplicación
  const handleDuplicate = async (id: string, nombre: string) => {
    try {
      const duplicada = await duplicatePlantilla.mutateAsync(id);
      toast.success(`Plantilla "${nombre}" duplicada correctamente`);
      router.push(`/admin/plantillas/${duplicada.id}`);
    } catch (error) {
      toast.error('Error al duplicar plantilla');
      console.error(error);
    }
  };

  // Obtener badge de estado
  const getEstadoBadge = (activo: boolean) => {
    return activo ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Activa
      </Badge>
    ) : (
      <Badge variant="secondary">Inactiva</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Plantillas de Onboarding
          </h1>
          <p className="text-slate-500">
            Gestiona las plantillas de procesos de onboarding
          </p>
        </div>
        <Button onClick={() => router.push('/admin/plantillas/crear')}>
          <Plus className="mr-2 h-4 w-4" />
          Crear plantilla
        </Button>
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
            <div className="md:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Buscar por nombre..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Filtro por departamento */}
            <div>
              <Select
                value={filters.departamentoId ?? FILTRO_TODOS_VALUE}
                onValueChange={(value) =>
                  handleFilterChange(
                    'departamentoId',
                    value === FILTRO_TODOS_VALUE ? undefined : value
                  )
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos los departamentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTRO_TODOS_VALUE}>Todos los departamentos</SelectItem>
                  {departamentos.map((dept: Departamento) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por estado */}
            <div>
              <Select
                value={
                  filters.activo === undefined ? FILTRO_TODOS_VALUE : String(filters.activo)
                }
                onValueChange={(value) =>
                  handleFilterChange(
                    'activo',
                    value === FILTRO_TODOS_VALUE ? undefined : value === 'true'
                  )
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTRO_TODOS_VALUE}>Todas</SelectItem>
                  <SelectItem value="true">Activas</SelectItem>
                  <SelectItem value="false">Inactivas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de plantillas */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de plantillas</CardTitle>
          <CardDescription>
            {filteredPlantillas.length > 0
              ? `${filteredPlantillas.length} plantilla${filteredPlantillas.length !== 1 ? 's' : ''} encontrada${filteredPlantillas.length !== 1 ? 's' : ''}`
              : 'No hay plantillas'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-red-600">Error al cargar plantillas</p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="mt-4"
              >
                Reintentar
              </Button>
            </div>
          ) : filteredPlantillas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-4 h-12 w-12 text-slate-400" />
              <p className="text-sm text-slate-500">
                {search || filters.departamentoId || filters.activo !== undefined
                  ? 'No se encontraron plantillas con los filtros seleccionados'
                  : 'No hay plantillas creadas. Crea tu primera plantilla para comenzar.'}
              </p>
              {!search && !filters.departamentoId && filters.activo === undefined && (
                <Button
                  onClick={() => router.push('/admin/plantillas/crear')}
                  className="mt-4"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primera plantilla
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Tabla Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                        Nombre
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                        Departamento
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-700">
                        Tareas
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-700">
                        Duración
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
                    {filteredPlantillas.map((plantilla) => (
                      <tr
                        key={plantilla.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-slate-900">
                              {plantilla.nombre}
                            </p>
                            {plantilla.descripcion && (
                              <p className="text-sm text-slate-500 truncate max-w-xs">
                                {plantilla.descripcion}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {plantilla.departamentoNombre || 'General'}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-slate-600">
                          {plantilla.totalTareas ?? 0}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-slate-600">
                          {plantilla.duracionEstimadaDias
                            ? `${plantilla.duracionEstimadaDias} días`
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getEstadoBadge(plantilla.activo)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(`/admin/plantillas/${plantilla.id}`)
                              }
                              title="Editar"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDuplicate(plantilla.id, plantilla.nombre)}
                              title="Duplicar"
                              disabled={duplicatePlantilla.isPending}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(plantilla.id, plantilla.nombre)}
                              title="Eliminar"
                              disabled={deletePlantilla.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards Mobile */}
              <div className="md:hidden space-y-4">
                {filteredPlantillas.map((plantilla) => (
                  <Card key={plantilla.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">
                            {plantilla.nombre}
                          </CardTitle>
                          {plantilla.descripcion && (
                            <CardDescription className="mt-1 line-clamp-2">
                              {plantilla.descripcion}
                            </CardDescription>
                          )}
                        </div>
                        {getEstadoBadge(plantilla.activo)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Departamento:</span>
                          <span className="font-medium">
                            {plantilla.departamentoNombre || 'General'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Tareas:</span>
                          <span className="font-medium">{plantilla.totalTareas ?? 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Duración estimada:</span>
                          <span className="font-medium">
                            {plantilla.duracionEstimadaDias
                              ? `${plantilla.duracionEstimadaDias} días`
                              : '-'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() =>
                            router.push(`/admin/plantillas/${plantilla.id}`)
                          }
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicate(plantilla.id, plantilla.nombre)}
                          disabled={duplicatePlantilla.isPending}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(plantilla.id, plantilla.nombre)}
                          disabled={deletePlantilla.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
