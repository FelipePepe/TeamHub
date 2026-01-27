'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useEmpleados, useDeleteEmpleado } from '@/hooks/use-empleados';
import { usePermissions } from '@/hooks/use-permissions';
import { toast } from 'sonner';
import type { EmpleadoFilters, UserRole } from '@/types';

/**
 * Página de listado de empleados para administradores y RRHH
 * Permite ver, filtrar, buscar y gestionar empleados
 */
export default function EmpleadosPage() {
  const router = useRouter();
  const { canManageUsers } = usePermissions();
  const [filters, setFilters] = useState<EmpleadoFilters>({
    page: 1,
    limit: 20,
    activo: true,
  });
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useEmpleados(filters);
  const deleteEmpleado = useDeleteEmpleado();

  // Verificar permisos
  if (!canManageUsers) {
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

  // Manejar búsqueda con debounce
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setFilters((prev) => ({
      ...prev,
      search: value || undefined,
      page: 1, // Reset a primera página al buscar
    }));
  };

  // Manejar filtros
  const handleFilterChange = (key: keyof EmpleadoFilters, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset a primera página al cambiar filtros
    }));
  };

  // Manejar paginación
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  // Manejar eliminación
  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${nombre}?`)) {
      return;
    }

    try {
      await deleteEmpleado.mutateAsync(id);
      toast.success('Empleado eliminado correctamente');
    } catch (error) {
      toast.error('Error al eliminar empleado');
      console.error(error);
    }
  };

  // Calcular paginación
  const currentPage = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.ceil(total / limit);
  const empleados = data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Empleados</h1>
          <p className="text-slate-500">Gestiona los empleados de la organización</p>
        </div>
        <Button onClick={() => router.push('/admin/empleados/nuevo')}>
          <Plus className="mr-2 h-4 w-4" />
          Crear empleado
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
          <div className="grid gap-4 md:grid-cols-4">
            {/* Búsqueda */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Filtro por rol */}
            <div>
              <select
                value={filters.rol ?? ''}
                onChange={(e) =>
                  handleFilterChange('rol', e.target.value || undefined)
                }
                className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
              >
                <option value="">Todos los roles</option>
                <option value="ADMIN">Administrador</option>
                <option value="RRHH">Recursos Humanos</option>
                <option value="MANAGER">Manager</option>
                <option value="EMPLEADO">Empleado</option>
              </select>
            </div>

            {/* Filtro por estado */}
            <div>
              <select
                value={filters.activo === undefined ? '' : String(filters.activo)}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFilterChange(
                    'activo',
                    value === '' ? undefined : value === 'true'
                  );
                }}
                className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de empleados */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de empleados</CardTitle>
          <CardDescription>
            {total > 0 ? `${total} empleado${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}` : 'No hay empleados'}
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
              <p className="text-sm text-red-600">Error al cargar empleados</p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="mt-4"
              >
                Reintentar
              </Button>
            </div>
          ) : empleados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="mb-4 h-12 w-12 text-slate-400" />
              <p className="text-sm text-slate-500">
                No se encontraron empleados con los filtros seleccionados
              </p>
            </div>
          ) : (
            <>
              {/* Tabla */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                        Empleado
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                        Rol
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {empleados.map((empleado) => (
                      <tr
                        key={empleado.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                              {empleado.nombre.charAt(0)}
                              {empleado.apellidos?.charAt(0) ?? ''}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {empleado.nombre} {empleado.apellidos}
                              </p>
                              {empleado.departamentoId && (
                                <p className="text-xs text-slate-500">
                                  Departamento ID: {empleado.departamentoId.slice(0, 8)}...
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {empleado.email}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{empleado.rol}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={empleado.activo ? 'default' : 'secondary'}
                          >
                            {empleado.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                router.push(`/admin/empleados/${empleado.id}`)
                              }
                              title="Ver detalle"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                router.push(`/admin/empleados/${empleado.id}/editar`)
                              }
                              title="Editar"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleDelete(empleado.id, empleado.nombre)
                              }
                              title="Eliminar"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    Mostrando {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, total)} de {total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <span className="text-sm text-slate-600">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
