// Formulario modal para crear y editar departamentos
// Generado mediante sistema colaborativo multi-LLM

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useCreateDepartamento,
  useUpdateDepartamento,
  useDepartamento,
} from '@/hooks/use-departamentos';
import type { CreateDepartamentoData, UpdateDepartamentoData } from '@/types';

// Schema de validación Zod
const departamentoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es demasiado largo'),
  codigo: z
    .string()
    .min(1, 'El código es requerido')
    .max(20, 'El código es demasiado largo')
    .regex(/^[A-Z0-9_-]+$/, 'El código solo puede contener mayúsculas, números, guiones y guiones bajos'),
  descripcion: z.string().max(500, 'La descripción es demasiado larga').optional(),
  responsableId: z.string().uuid('ID de responsable inválido').optional().or(z.literal('')),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe ser un código hexadecimal válido (ej: #FF5733)')
    .optional()
    .or(z.literal('')),
});

type DepartamentoFormData = z.infer<typeof departamentoSchema>;

interface DepartamentoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departamentoId?: string | null;
  onSuccess?: () => void;
}

/**
 * Componente de formulario modal para crear y editar departamentos
 *
 * @param open - Si el modal está abierto
 * @param onOpenChange - Callback cuando cambia el estado del modal
 * @param departamentoId - ID del departamento a editar (null/undefined para crear)
 * @param onSuccess - Callback cuando la operación es exitosa
 */
export function DepartamentoForm({
  open,
  onOpenChange,
  departamentoId,
  onSuccess,
}: DepartamentoFormProps) {
  const isEditing = !!departamentoId;
  const { data: departamento, isLoading: isLoadingDepartamento } = useDepartamento(
    departamentoId || '',
    isEditing && open
  );

  const createDepartamento = useCreateDepartamento();
  const updateDepartamento = useUpdateDepartamento();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<DepartamentoFormData>({
    resolver: zodResolver(departamentoSchema),
    defaultValues: {
      nombre: '',
      codigo: '',
      descripcion: '',
      responsableId: '',
      color: '',
    },
  });

  const colorValue = watch('color');

  // Cargar datos cuando se abre el modal en modo edición
  useEffect(() => {
    if (open && isEditing && departamento) {
      setValue('nombre', departamento.nombre);
      setValue('codigo', departamento.codigo);
      setValue('descripcion', departamento.descripcion || '');
      setValue('responsableId', departamento.responsableId || '');
      setValue('color', departamento.color || '');
    } else if (open && !isEditing) {
      // Resetear formulario al abrir en modo creación
      reset({
        nombre: '',
        codigo: '',
        descripcion: '',
        responsableId: '',
        color: '',
      });
    }
  }, [open, isEditing, departamento, setValue, reset]);

  // Resetear formulario al cerrar el modal
  useEffect(() => {
    if (!open) {
      reset({
        nombre: '',
        codigo: '',
        descripcion: '',
        responsableId: '',
        color: '',
      });
    }
  }, [open, reset]);

  const onSubmit = async (data: DepartamentoFormData) => {
    try {
      if (isEditing && departamentoId) {
        const updateData: UpdateDepartamentoData = {
          nombre: data.nombre,
          codigo: data.codigo,
          descripcion: data.descripcion || undefined,
          responsableId: data.responsableId || undefined,
          color: data.color || undefined,
        };

        await updateDepartamento.mutateAsync({
          id: departamentoId,
          data: updateData,
        });

        toast.success('Departamento actualizado correctamente');
      } else {
        const createData: CreateDepartamentoData = {
          nombre: data.nombre,
          codigo: data.codigo,
          descripcion: data.descripcion || undefined,
          responsableId: data.responsableId || undefined,
          color: data.color || undefined,
        };

        await createDepartamento.mutateAsync(createData);

        toast.success('Departamento creado correctamente');
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === 'object' && 'error' in error
          ? (error as { error: string }).error
          : 'Error al guardar el departamento';

      toast.error(errorMessage);
      console.error('Error al guardar departamento:', error);
    }
  };

  const isLoading = isSubmitting || createDepartamento.isPending || updateDepartamento.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar departamento' : 'Crear departamento'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica la información del departamento'
              : 'Completa los datos para crear un nuevo departamento'}
          </DialogDescription>
        </DialogHeader>

        {isEditing && isLoadingDepartamento ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombre"
                placeholder="Ej: Tecnología"
                disabled={isLoading}
                {...register('nombre')}
              />
              {errors.nombre && (
                <p className="text-sm text-red-500">{errors.nombre.message}</p>
              )}
            </div>

            {/* Código */}
            <div className="space-y-2">
              <Label htmlFor="codigo">
                Código <span className="text-red-500">*</span>
              </Label>
              <Input
                id="codigo"
                placeholder="Ej: IT"
                disabled={isLoading}
                className="uppercase"
                {...register('codigo', {
                  onChange: (e) => {
                    // Convertir a mayúsculas automáticamente
                    e.target.value = e.target.value.toUpperCase();
                  },
                })}
              />
              {errors.codigo && (
                <p className="text-sm text-red-500">{errors.codigo.message}</p>
              )}
              <p className="text-xs text-slate-500">
                Solo mayúsculas, números, guiones y guiones bajos
              </p>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <textarea
                id="descripcion"
                rows={3}
                placeholder="Descripción del departamento..."
                disabled={isLoading}
                className="flex min-h-[60px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                {...register('descripcion')}
              />
              {errors.descripcion && (
                <p className="text-sm text-red-500">{errors.descripcion.message}</p>
              )}
            </div>

            {/* Responsable */}
            <div className="space-y-2">
              <Label htmlFor="responsableId">Responsable</Label>
              <Input
                id="responsableId"
                type="text"
                placeholder="ID del responsable (UUID)"
                disabled={isLoading}
                {...register('responsableId')}
              />
              {errors.responsableId && (
                <p className="text-sm text-red-500">{errors.responsableId.message}</p>
              )}
              <p className="text-xs text-slate-500">
                TODO: Implementar select de usuarios con rol MANAGER o superior
              </p>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  className="h-10 w-20 cursor-pointer"
                  disabled={isLoading}
                  {...register('color')}
                />
                <Input
                  type="text"
                  placeholder="#FF5733"
                  disabled={isLoading}
                  maxLength={7}
                  value={colorValue || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                      setValue('color', value);
                    }
                  }}
                />
              </div>
              {errors.color && (
                <p className="text-sm text-red-500">{errors.color.message}</p>
              )}
              <p className="text-xs text-slate-500">Color para identificar el departamento en la UI</p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
