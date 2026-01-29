'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Building2,
  UserCircle,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useEmpleado, useDeleteEmpleado } from '@/hooks/use-empleados';
import { usePermissions } from '@/hooks/use-permissions';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Página de detalle de empleado
 * Muestra información completa de un empleado específico
 */
export default function EmpleadoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { canManageUsers } = usePermissions();
  const { data: empleado, isLoading, error } = useEmpleado(resolvedParams.id);
  const deleteEmpleado = useDeleteEmpleado();

  // Verificar permisos
  if (!canManageUsers) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acceso denegado</CardTitle>
            <CardDescription>No tienes permisos para ver esta información</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Manejar eliminación
  const handleDelete = async () => {
    if (!empleado) return;

    if (!confirm(`¿Estás seguro de que quieres eliminar a ${empleado.nombre}?`)) {
      return;
    }

    try {
      await deleteEmpleado.mutateAsync(empleado.id);
      toast.success('Empleado eliminado correctamente');
      router.push('/admin/empleados');
    } catch (error) {
      toast.error('Error al eliminar empleado');
      console.error(error);
    }
  };

  // Estado de carga
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-96" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // Error al cargar
  if (error || !empleado) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>No se pudo cargar la información del empleado</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {empleado.nombre} {empleado.apellidos}
            </h1>
            <p className="text-slate-500">Información del empleado</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/empleados/${empleado.id}/editar`)}
          >
            <Edit2 className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Grid de información */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nombre completo */}
            <div>
              <p className="text-sm text-slate-500">Nombre completo</p>
              <p className="text-base font-medium text-slate-900">
                {empleado.nombre} {empleado.apellidos}
              </p>
            </div>

            {/* Email */}
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="text-base text-slate-900">{empleado.email}</p>
              </div>
            </div>

            {/* Teléfono */}
            {empleado.telefono && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Teléfono</p>
                  <p className="text-base text-slate-900">{empleado.telefono}</p>
                </div>
              </div>
            )}

            {/* Fecha de nacimiento */}
            {empleado.fechaNacimiento && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-500">Fecha de Nacimiento</p>
                  <p className="text-base text-slate-900">
                    {format(new Date(empleado.fechaNacimiento), 'PPP', { locale: es })}
                  </p>
                </div>
              </div>
            )}

            {/* Estado */}
            <div>
              <p className="text-sm text-slate-500 mb-1">Estado</p>
              <Badge variant={empleado.activo ? 'default' : 'secondary'}>
                {empleado.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Información organizacional */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información Organizacional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Rol */}
            <div>
              <p className="text-sm text-slate-500 mb-1">Rol</p>
              <Badge variant="outline" className="text-base">
                {empleado.rol}
              </Badge>
            </div>

            {/* Departamento */}
            <div>
              <p className="text-sm text-slate-500">Departamento</p>
              <p className="text-base text-slate-900">
                {empleado.departamentoId ? `ID: ${empleado.departamentoId}` : 'Sin asignar'}
              </p>
            </div>

            {/* Manager */}
            <div>
              <p className="text-sm text-slate-500">Manager</p>
              <p className="text-base text-slate-900">
                {empleado.managerId ? `ID: ${empleado.managerId}` : 'Sin asignar'}
              </p>
            </div>

            {/* Fecha de creación */}
            <div>
              <p className="text-sm text-slate-500">Fecha de registro</p>
              <p className="text-base text-slate-900">
                {format(new Date(empleado.createdAt), 'PPP', { locale: es })}
              </p>
            </div>

            {/* Última actualización */}
            <div>
              <p className="text-sm text-slate-500">Última actualización</p>
              <p className="text-base text-slate-900">
                {format(new Date(empleado.updatedAt), 'PPP', { locale: es })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Información Adicional</CardTitle>
          <CardDescription>Datos complementarios del empleado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500">ID de Usuario</p>
              <p className="text-sm font-mono text-slate-900">{empleado.id}</p>
            </div>
            {empleado.departamentoId && (
              <div>
                <p className="text-sm text-slate-500">ID de Departamento</p>
                <p className="text-sm font-mono text-slate-900">{empleado.departamentoId}</p>
              </div>
            )}
            {empleado.managerId && (
              <div>
                <p className="text-sm text-slate-500">ID de Manager</p>
                <p className="text-sm font-mono text-slate-900">{empleado.managerId}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
