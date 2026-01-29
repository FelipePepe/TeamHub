'use client';

import { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDepartamentos, useDeleteDepartamento } from '@/hooks/use-departamentos';
import { usePermissions } from '@/hooks/use-permissions';
import { DepartamentoForm } from '@/components/forms/departamento-form';
import { toast } from 'sonner';
import type { DepartamentoFilters, Departamento } from '@/types';

/**
 * Página de listado de departamentos para administradores y RRHH
 * Permite ver, filtrar, buscar y gestionar departamentos
 */
export default function DepartamentosPage() {
  const { canManageUsers } = usePermissions();
  const [filters, setFilters] = useState<DepartamentoFilters>({
    activo: true,
  });
  const [search, setSearch] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedDepartamentoId, setSelectedDepartamentoId] = useState<string | null>(null);

  const { data, isLoading } = useDepartamentos(filters);
  const deleteDepartamento = useDeleteDepartamento();

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

  // Manejar búsqueda
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setFilters((prev) => ({
      ...prev,
      search: value || undefined,
    }));
  };

  // Manejar filtros
  const handleFilterChange = (key: keyof DepartamentoFilters, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Abrir modal crear
  const handleCreate = () => {
    setSelectedDepartamentoId(null);
    setShowFormModal(true);
  };

  // Abrir modal editar
  const handleEdit = (departamento: Departamento) => {
    setSelectedDepartamentoId(departamento.id);
    setShowFormModal(true);
  };

  // Eliminar departamento
  const handleDelete = async (departamento: Departamento) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el departamento "${departamento.nombre}"?`)) {
      return;
    }

    try {
      await deleteDepartamento.mutateAsync(departamento.id);
      toast.success('Departamento eliminado correctamente');
    } catch (error) {
      toast.error('Error al eliminar departamento');
    }
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowFormModal(false);
    setSelectedDepartamentoId(null);
  };

  // Éxito en crear/editar
  const handleFormSuccess = () => {
    handleCloseModal();
    toast.success(selectedDepartamentoId ? 'Departamento actualizado' : 'Departamento creado');
  };

  const departamentos = data?.departamentos ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Departamentos</h1>
          <p className="text-slate-500">
            Gestiona los departamentos de la organización
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Crear Departamento
        </Button>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Búsqueda */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar por nombre o código..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro activo/inactivo */}
            <div className="flex gap-2">
              <Button
                variant={filters.activo === undefined ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('activo', undefined)}
              >
                Todos
              </Button>
              <Button
                variant={filters.activo === true ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('activo', true)}
              >
                Activos
              </Button>
              <Button
                variant={filters.activo === false ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('activo', false)}
              >
                Inactivos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenido principal */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : departamentos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="mb-4 h-12 w-12 text-slate-400" />
            <p className="text-center text-slate-600">
              {filters.search
                ? 'No se encontraron departamentos con ese criterio'
                : 'No hay departamentos registrados'}
            </p>
            {!filters.search && (
              <Button onClick={handleCreate} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Crear primer departamento
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departamentos.map((departamento) => (
            <Card key={departamento.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {departamento.color && (
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: departamento.color }}
                        />
                      )}
                      <CardTitle className="text-lg">{departamento.nombre}</CardTitle>
                    </div>
                    <CardDescription className="mt-1">
                      Código: {departamento.codigo}
                    </CardDescription>
                  </div>
                  <Badge variant={departamento.activo ? 'default' : 'secondary'}>
                    {departamento.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Descripción */}
                {departamento.descripcion && (
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {departamento.descripcion}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Users className="h-4 w-4" />
                  <span>{departamento._count?.usuarios || 0} empleados</span>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(departamento)}
                    className="flex-1 gap-2"
                  >
                    <Edit2 className="h-3 w-3" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(departamento)}
                    className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de formulario */}
      <DepartamentoForm
        open={showFormModal}
        onOpenChange={setShowFormModal}
        departamentoId={selectedDepartamentoId}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
