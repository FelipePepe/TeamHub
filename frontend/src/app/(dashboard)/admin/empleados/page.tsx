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
import { useEmpleados, useDeleteEmpleado } from '@/hooks/use-empleados';
import { usePermissions } from '@/hooks/use-permissions';
import { EmpleadoForm } from '@/components/forms/empleado-form';
import { toast } from 'sonner';
import type { EmpleadoFilters } from '@/types';
import type { User } from '@/types';

const FILTRO_TODOS_VALUE = '__todos__';

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
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState<User | undefined>();

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

  // Abrir modal crear
  const handleCreate = () => {
    setSelectedEmpleado(undefined);
    setShowFormModal(true);
  };

  // Abrir modal editar
  const handleEdit = (empleado: User) => {
    setSelectedEmpleado(empleado);
    setShowFormModal(true);
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
          <h1 className="text-2xl font-semibold text-foreground">Empleados</h1>
          <p className="text-muted-foreground">Gestiona los empleados de la organización</p>
        </div>
        <Button onClick={handleCreate}>
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
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
              <Select
                value={filters.rol ?? FILTRO_TODOS_VALUE}
                onValueChange={(value) =>
                  handleFilterChange('rol', value === FILTRO_TODOS_VALUE ? undefined : value)
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos los roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTRO_TODOS_VALUE}>Todos los roles</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="RRHH">Recursos Humanos</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="EMPLEADO">Empleado</SelectItem>
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
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTRO_TODOS_VALUE}>Todos</SelectItem>
                  <SelectItem value="true">Activos</SelectItem>
                  <SelectItem value="false">Inactivos</SelectItem>
                </SelectContent>
              </Select>
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
              <Users className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No se encontraron empleados con los filtros seleccionados
              </p>
            </div>
          ) : (
            <>
              {/* Tabla */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">
                        Empleado
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">
                        Rol
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-700 dark:text-slate-200">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {empleados.map((empleado) => (
                      <tr
                        key={empleado.id}
                        className="hover:bg-slate-50 transition-colors dark:hover:bg-slate-900/60"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                              {empleado.nombre.charAt(0)}
                              {empleado.apellidos?.charAt(0) ?? ''}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">
                                {empleado.nombre} {empleado.apellidos}
                              </p>
                              {empleado.departamentoNombre && (
                                <p className="text-xs text-muted-foreground">
                                  {empleado.departamentoNombre}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
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
                              onClick={() => handleEdit(empleado)}
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
                  <p className="text-sm text-muted-foreground">
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
                    <span className="text-sm text-slate-600 dark:text-slate-300">
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

      {/* Modal de Crear/Editar */}
      <EmpleadoForm
        open={showFormModal}
        onOpenChange={setShowFormModal}
        empleado={selectedEmpleado}
        onSuccess={() => {
          // El modal ya hace el toast, solo cerramos
        }}
      />
    </div>
  );
}
