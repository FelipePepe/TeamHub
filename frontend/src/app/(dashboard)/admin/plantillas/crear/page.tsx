'use client';
import type { Departamento } from '@/types';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Plus, GripVertical, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreatePlantilla, useCreateTareaPlantilla } from '@/hooks/use-plantillas';
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

interface TareaLocal extends TareaFormData {
  id: string;
  orden: number;
}

// ============================================================================
// Main Component
// ============================================================================

export default function CrearPlantillaPage() {
  const router = useRouter();
  const { canManageTemplates } = usePermissions();
  const [tareas, setTareas] = useState<TareaLocal[]>([]);
  const [editingTarea, setEditingTarea] = useState<TareaLocal | null>(null);
  const [showTareaForm, setShowTareaForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: departamentosData } = useDepartamentos();
  const createPlantilla = useCreatePlantilla();
  const createTarea = useCreateTareaPlantilla();

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

  // Check permissions
  if (!canManageTemplates) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>No tienes permisos para crear plantillas</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // Tareas Management
  // ============================================================================

  const handleAddTarea = (data: TareaFormData) => {
    if (editingTarea) {
      setTareas((prev) =>
        prev.map((t) =>
          t.id === editingTarea.id ? { ...editingTarea, ...data } : t
        )
      );
      setEditingTarea(null);
    } else {
      const newTarea: TareaLocal = {
        ...data,
        id: crypto.randomUUID(),
        orden: tareas.length + 1,
      };
      setTareas((prev) => [...prev, newTarea]);
    }
    tareaForm.reset();
    setShowTareaForm(false);
  };

  const handleEditTarea = (tarea: TareaLocal) => {
    setEditingTarea(tarea);
    tareaForm.reset({
      titulo: tarea.titulo,
      descripcion: tarea.descripcion,
      categoria: tarea.categoria,
      responsable: tarea.responsable,
      duracionEstimadaDias: tarea.duracionEstimadaDias,
      esOpcional: tarea.esOpcional,
      requiereAprobacion: tarea.requiereAprobacion,
      dependencias: tarea.dependencias,
    });
    setShowTareaForm(true);
  };

  const handleDeleteTarea = (id: string) => {
    setTareas((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      // Reorder
      return filtered.map((t, idx) => ({ ...t, orden: idx + 1 }));
    });
    // Remove dependencies
    setTareas((prev) =>
      prev.map((t) => ({
        ...t,
        dependencias: t.dependencias.filter((depId) => depId !== id),
      }))
    );
  };

  const handleMoveTarea = (id: string, direction: 'up' | 'down') => {
    setTareas((prev) => {
      const index = prev.findIndex((t) => t.id === id);
      if (index === -1) return prev;
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === prev.length - 1) return prev;

      const newTareas = [...prev];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      [newTareas[index], newTareas[swapIndex]] = [newTareas[swapIndex], newTareas[index]];

      // Update orden
      return newTareas.map((t, idx) => ({ ...t, orden: idx + 1 }));
    });
  };

  // ============================================================================
  // Form Submit
  // ============================================================================

  const onSubmit = async (data: PlantillaFormData) => {
    if (tareas.length === 0) {
      toast.error('Debes añadir al menos una tarea');
      return;
    }

    setIsSubmitting(true);

    try {
      // First create plantilla
      const plantilla = await createPlantilla.mutateAsync(data);

      // Then create tareas sequentially
      for (const tarea of tareas) {
        await createTarea.mutateAsync({
          plantillaId: plantilla.id,
          titulo: tarea.titulo,
          descripcion: tarea.descripcion,
          orden: tarea.orden,
          categoria: tarea.categoria,
          responsable: tarea.responsable,
          duracionEstimadaDias: tarea.duracionEstimadaDias,
          esOpcional: tarea.esOpcional,
          requiereAprobacion: tarea.requiereAprobacion,
          dependencias: tarea.dependencias,
        });
      }

      toast.success('Plantilla creada correctamente');
      router.push('/admin/plantillas');
    } catch (error) {
      console.error('Error creating plantilla:', error);
      toast.error('Error al crear la plantilla');
    } finally {
      setIsSubmitting(false);
    }
  };

  const departamentos = departamentosData?.data ?? [];

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
            <h1 className="text-3xl font-bold">Nueva Plantilla de Onboarding</h1>
            <p className="text-muted-foreground">
              Define los datos generales y las tareas del proceso
            </p>
          </div>
        </div>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Guardando...' : 'Guardar Plantilla'}
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
                  value={form.watch('departamentoId')}
                  onValueChange={(value) =>
                    form.setValue('departamentoId', value === 'all' ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los departamentos</SelectItem>
                    {departamentos.map((dept: Departamento) => (
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
                  value={form.watch('rolDestino')}
                  onValueChange={(value) =>
                    form.setValue('rolDestino', value === 'any' ? undefined : (value as 'EMPLEADO' | 'MANAGER' | 'RRHH' | 'ADMIN'))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Cualquier rol</SelectItem>
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
                  Define las tareas del proceso de onboarding
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
                                        deps.filter((id) => id !== t.id)
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
                      <Button type="submit" size="sm">
                        {editingTarea ? 'Actualizar' : 'Añadir'}
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
                  <p>No hay tareas añadidas</p>
                  <p className="text-sm">Añade al menos una tarea para continuar</p>
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
                        {tarea.dependencias.length > 0 && (
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
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleMoveTarea(tarea.id, 'up')}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleMoveTarea(tarea.id, 'down')}
                        disabled={index === tareas.length - 1}
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
