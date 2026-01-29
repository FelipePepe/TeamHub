'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Plus, GripVertical, Trash2, Edit2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  usePlantilla,
  useTareasPlantilla,
  useUpdatePlantilla,
  useCreateTareaPlantilla,
  useUpdateTareaPlantilla,
  useDeleteTareaPlantilla,
  type TareaPlantilla,
} from '@/hooks/use-plantillas';
import { useDepartamentos } from '@/hooks/use-departamentos';
import { usePermissions } from '@/hooks/use-permissions';
import { toast } from 'sonner';
import type { CategoriaTarea, TipoResponsable } from '@/hooks/use-plantillas';

// ============================================================================
// Validation Schemas
// ============================================================================

const plantillaSchema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres').max(150, 'Máximo 150 caracteres'),
  descripcion: z.string().optional(),
  departamentoId: z.string().optional(),
  rolDestino: z.enum(['ADMIN', 'RRHH', 'MANAGER', 'EMPLEADO']).optional(),
  duracionEstimadaDias: z.coerce.number().int().min(1).max(365).optional(),
});

const tareaSchema = z.object({
  titulo: z.string().min(3, 'Mínimo 3 caracteres').max(200, 'Máximo 200 caracteres'),
  descripcion: z.string().optional(),
  categoria: z.enum(['DOCUMENTACION', 'EQUIPAMIENTO', 'ACCESOS', 'FORMACION', 'REUNIONES', 'ADMINISTRATIVO']),
  responsable: z.enum(['RRHH', 'MANAGER', 'IT', 'EMPLEADO', 'CUSTOM']),
  duracionEstimadaDias: z.coerce.number().int().min(0).max(365).optional(),
  esOpcional: z.boolean().default(false),
  requiereAprobacion: z.boolean().default(false),
  dependencias: z.array(z.string()).default([]),
});

type PlantillaFormData = z.infer<typeof plantillaSchema>;
type TareaFormData = z.infer<typeof tareaSchema>;

// ============================================================================
// Main Component
// ============================================================================

export default function EditarPlantillaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { canManageTemplates } = usePermissions();
  const [editingTarea, setEditingTarea] = useState<TareaPlantilla | null>(null);
  const [showTareaForm, setShowTareaForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: plantilla, isLoading: loadingPlantilla } = usePlantilla(id);
  const { data: tareasData, isLoading: loadingTareas } = useTareasPlantilla(id);
  const { data: departamentosData } = useDepartamentos();

  const updatePlantilla = useUpdatePlantilla();
  const createTarea = useCreateTareaPlantilla();
  const updateTarea = useUpdateTareaPlantilla();
  const deleteTarea = useDeleteTareaPlantilla();

  const form = useForm<PlantillaFormData>({
    resolver: zodResolver(plantillaSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      duracionEstimadaDias: undefined,
    },
  });

  const tareaForm = useForm<TareaFormData>({
    resolver: zodResolver(tareaSchema),
    defaultValues: {
      titulo: '',
      descripcion: '',
      categoria: 'DOCUMENTACION',
      responsable: 'RRHH',
      duracionEstimadaDias: undefined,
      esOpcional: false,
      requiereAprobacion: false,
      dependencias: [],
    },
  });

  // Load plantilla data into form
  useEffect(() => {
    if (plantilla) {
      form.reset({
        nombre: plantilla.nombre,
        descripcion: plantilla.descripcion,
        departamentoId: plantilla.departamentoId,
        rolDestino: plantilla.rolDestino,
        duracionEstimadaDias: plantilla.duracionEstimadaDias,
      });
    }
  }, [plantilla, form]);

  // Check permissions
  if (!canManageTemplates) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>No tienes permisos para editar plantillas</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Loading state
  if (loadingPlantilla || loadingTareas) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  // Not found
  if (!plantilla) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Plantilla no encontrada</CardTitle>
            <CardDescription>La plantilla que buscas no existe</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/admin/plantillas')}>
              Volver al listado
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tareas = tareasData?.tareas ?? [];
  const departamentos = departamentosData?.departamentos ?? [];

  // ============================================================================
  // Tareas Management
  // ============================================================================

  const handleAddTarea = async (data: TareaFormData) => {
    if (editingTarea) {
      // Update existing
      try {
        await updateTarea.mutateAsync({
          plantillaId: id,
          tareaId: editingTarea.id,
          data: {
            ...data,
            orden: editingTarea.orden,
          },
        });
        toast.success('Tarea actualizada');
        setEditingTarea(null);
        tareaForm.reset();
        setShowTareaForm(false);
      } catch (error) {
        console.error('Error updating tarea:', error);
        toast.error('Error al actualizar tarea');
      }
    } else {
      // Create new
      try {
        await createTarea.mutateAsync({
          plantillaId: id,
          ...data,
          orden: tareas.length + 1,
        });
        toast.success('Tarea añadida');
        tareaForm.reset();
        setShowTareaForm(false);
      } catch (error) {
        console.error('Error creating tarea:', error);
        toast.error('Error al añadir tarea');
      }
    }
  };

  const handleEditTarea = (tarea: TareaPlantilla) => {
    setEditingTarea(tarea);
    tareaForm.reset({
      titulo: tarea.titulo,
      descripcion: tarea.descripcion,
      categoria: tarea.categoria,
      responsable: tarea.responsable,
      duracionEstimadaDias: tarea.duracionEstimadaDias,
      esOpcional: tarea.esOpcional,
      requiereAprobacion: tarea.requiereAprobacion,
      dependencias: tarea.dependencias || [],
    });
    setShowTareaForm(true);
  };

  const handleDeleteTarea = async (tareaId: string) => {
    if (!confirm('¿Eliminar esta tarea?')) return;

    try {
      await deleteTarea.mutateAsync({ plantillaId: id, tareaId });
      toast.success('Tarea eliminada');
    } catch (error) {
      console.error('Error deleting tarea:', error);
      toast.error('Error al eliminar tarea');
    }
  };

  const handleMoveTarea = async (tarea: TareaPlantilla, direction: 'up' | 'down') => {
    const index = tareas.findIndex((t) => t.id === tarea.id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === tareas.length - 1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const otherTarea = tareas[swapIndex];

    try {
      // Swap orden
      await Promise.all([
        updateTarea.mutateAsync({
          plantillaId: id,
          tareaId: tarea.id,
          data: { orden: otherTarea.orden },
        }),
        updateTarea.mutateAsync({
          plantillaId: id,
          tareaId: otherTarea.id,
          data: { orden: tarea.orden },
        }),
      ]);
      toast.success('Orden actualizado');
    } catch (error) {
      console.error('Error updating orden:', error);
      toast.error('Error al reordenar');
    }
  };

  // ============================================================================
  // Form Submit
  // ============================================================================

  const onSubmit = async (data: PlantillaFormData) => {
    setIsSubmitting(true);

    try {
      await updatePlantilla.mutateAsync({ id, data });
      toast.success('Plantilla actualizada correctamente');
      router.push('/admin/plantillas');
    } catch (error) {
      console.error('Error updating plantilla:', error);
      toast.error('Error al actualizar la plantilla');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/plantillas')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Editar Plantilla</h1>
            <p className="text-muted-foreground">{plantilla.nombre}</p>
          </div>
        </div>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* LEFT: Datos Generales */}
        <Card>
          <CardHeader>
            <CardTitle>Datos Generales</CardTitle>
            <CardDescription>
              Información básica de la plantilla
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nombre"
                  {...form.register('nombre')}
                  placeholder="Ej: Onboarding Desarrollador Frontend"
                />
                {form.formState.errors.nombre && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.nombre.message}
                  </p>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  {...form.register('descripcion')}
                  placeholder="Descripción opcional de la plantilla"
                  rows={4}
                />
              </div>

              {/* Departamento */}
              <div className="space-y-2">
                <Label htmlFor="departamentoId">Departamento</Label>
                <Select
                  value={form.watch('departamentoId') || ''}
                  onValueChange={(value) =>
                    form.setValue('departamentoId', value || undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los departamentos</SelectItem>
                    {departamentos.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rol Destino */}
              <div className="space-y-2">
                <Label htmlFor="rolDestino">Rol Destino</Label>
                <Select
                  value={form.watch('rolDestino') || ''}
                  onValueChange={(value) =>
                    form.setValue('rolDestino', (value as 'EMPLEADO' | 'MANAGER' | 'RRHH' | 'ADMIN') || undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Cualquier rol</SelectItem>
                    <SelectItem value="EMPLEADO">Empleado</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="RRHH">RRHH</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duración Estimada */}
              <div className="space-y-2">
                <Label htmlFor="duracionEstimadaDias">
                  Duración Estimada (días)
                </Label>
                <Input
                  id="duracionEstimadaDias"
                  type="number"
                  min="1"
                  max="365"
                  {...form.register('duracionEstimadaDias')}
                  placeholder="30"
                />
                {form.formState.errors.duracionEstimadaDias && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.duracionEstimadaDias.message}
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* RIGHT: Tareas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tareas ({tareas.length})</CardTitle>
                <CardDescription>
                  Gestiona las tareas del proceso
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setEditingTarea(null);
                  tareaForm.reset();
                  setShowTareaForm(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Añadir Tarea
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Tarea Form */}
            {showTareaForm && (
              <Card className="mb-4 border-2 border-primary">
                <CardHeader>
                  <CardTitle className="text-base">
                    {editingTarea ? 'Editar Tarea' : 'Nueva Tarea'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={tareaForm.handleSubmit(handleAddTarea)}
                    className="space-y-3"
                  >
                    {/* Título */}
                    <div className="space-y-1">
                      <Label htmlFor="tarea-titulo">
                        Título <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="tarea-titulo"
                        {...tareaForm.register('titulo')}
                        placeholder="Ej: Completar formulario de datos personales"
                      />
                      {tareaForm.formState.errors.titulo && (
                        <p className="text-sm text-destructive">
                          {tareaForm.formState.errors.titulo.message}
                        </p>
                      )}
                    </div>

                    {/* Descripción */}
                    <div className="space-y-1">
                      <Label htmlFor="tarea-descripcion">Descripción</Label>
                      <Textarea
                        id="tarea-descripcion"
                        {...tareaForm.register('descripcion')}
                        placeholder="Descripción opcional"
                        rows={2}
                      />
                    </div>

                    {/* Categoría y Responsable */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="tarea-categoria">
                          Categoría <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={tareaForm.watch('categoria')}
                          onValueChange={(value) =>
                            tareaForm.setValue('categoria', value as CategoriaTarea)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DOCUMENTACION">Documentación</SelectItem>
                            <SelectItem value="EQUIPAMIENTO">Equipamiento</SelectItem>
                            <SelectItem value="ACCESOS">Accesos</SelectItem>
                            <SelectItem value="FORMACION">Formación</SelectItem>
                            <SelectItem value="REUNIONES">Reuniones</SelectItem>
                            <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="tarea-responsable">
                          Responsable <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={tareaForm.watch('responsable')}
                          onValueChange={(value) =>
                            tareaForm.setValue('responsable', value as TipoResponsable)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="RRHH">RRHH</SelectItem>
                            <SelectItem value="MANAGER">Manager</SelectItem>
                            <SelectItem value="IT">IT</SelectItem>
                            <SelectItem value="EMPLEADO">Empleado</SelectItem>
                            <SelectItem value="CUSTOM">Personalizado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Duración Estimada */}
                    <div className="space-y-1">
                      <Label htmlFor="tarea-duracion">Duración (días)</Label>
                      <Input
                        id="tarea-duracion"
                        type="number"
                        min="0"
                        max="365"
                        {...tareaForm.register('duracionEstimadaDias')}
                        placeholder="0"
                      />
                    </div>

                    {/* Dependencias */}
                    {tareas.length > 0 && (
                      <div className="space-y-1">
                        <Label>Dependencias (opcional)</Label>
                        <div className="rounded-md border p-3 space-y-2 max-h-32 overflow-y-auto">
                          {tareas
                            .filter((t) => !editingTarea || t.id !== editingTarea.id)
                            .map((t) => (
                              <label
                                key={t.id}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={tareaForm.watch('dependencias').includes(t.id)}
                                  onChange={(e) => {
                                    const deps = tareaForm.watch('dependencias');
                                    if (e.target.checked) {
                                      tareaForm.setValue('dependencias', [...deps, t.id]);
                                    } else {
                                      tareaForm.setValue(
                                        'dependencias',
                                        deps.filter((depId) => depId !== t.id)
                                      );
                                    }
                                  }}
                                  className="rounded"
                                />
                                <span className="text-sm">{t.titulo}</span>
                              </label>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Flags */}
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          {...tareaForm.register('esOpcional')}
                          className="rounded"
                        />
                        <span className="text-sm">Opcional</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          {...tareaForm.register('requiereAprobacion')}
                          className="rounded"
                        />
                        <span className="text-sm">Requiere Aprobación</span>
                      </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={createTarea.isPending || updateTarea.isPending}
                      >
                        {createTarea.isPending || updateTarea.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Guardando...
                          </>
                        ) : editingTarea ? (
                          'Actualizar'
                        ) : (
                          'Añadir'
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowTareaForm(false);
                          setEditingTarea(null);
                          tareaForm.reset();
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Tareas List */}
            <div className="space-y-2">
              {tareas.length === 0 && !showTareaForm && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay tareas definidas</p>
                  <p className="text-sm">Añade al menos una tarea</p>
                </div>
              )}

              {tareas.map((tarea, index) => (
                <Card key={tarea.id} className="p-3">
                  <div className="flex items-start gap-3">
                    {/* Drag Handle & Order */}
                    <div className="flex flex-col items-center gap-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className="text-xs">
                        {tarea.orden}
                      </Badge>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{tarea.titulo}</h4>
                          {tarea.descripcion && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {tarea.descripcion}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {tarea.categoria}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {tarea.responsable}
                        </Badge>
                        {tarea.esOpcional && (
                          <Badge variant="outline" className="text-xs">
                            Opcional
                          </Badge>
                        )}
                        {tarea.requiereAprobacion && (
                          <Badge variant="outline" className="text-xs">
                            Req. Aprobación
                          </Badge>
                        )}
                        {tarea.dependencias && tarea.dependencias.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {tarea.dependencias.length} dep.
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleEditTarea(tarea)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleDeleteTarea(tarea.id)}
                        disabled={deleteTarea.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleMoveTarea(tarea, 'up')}
                        disabled={index === 0 || updateTarea.isPending}
                      >
                        ↑
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleMoveTarea(tarea, 'down')}
                        disabled={index === tareas.length - 1 || updateTarea.isPending}
                      >
                        ↓
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
