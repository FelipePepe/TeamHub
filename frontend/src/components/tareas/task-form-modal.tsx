'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateTarea, useUpdateTarea } from '@/hooks/use-tareas';
import { useEmpleados } from '@/hooks/use-empleados';
import { toast } from 'sonner';
import type { Tarea, PrioridadTarea } from '@/types';

const tareaFormSchema = z
  .object({
    titulo: z.string().min(3, 'Mínimo 3 caracteres').max(200, 'Máximo 200 caracteres'),
    descripcion: z.string().optional(),
    prioridad: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
      errorMap: () => ({ message: 'Prioridad inválida' }),
    }),
    usuarioAsignadoId: z.string().uuid('Selecciona un usuario').optional(),
    fechaInicio: z.string().optional(),
    fechaFin: z.string().optional(),
    horasEstimadas: z.number().min(0, 'Debe ser positivo').optional(),
  })
  .refine(
    (data) => {
      if (data.fechaInicio && data.fechaFin) {
        return new Date(data.fechaFin) >= new Date(data.fechaInicio);
      }
      return true;
    },
    {
      message: 'La fecha de fin debe ser mayor o igual a la fecha de inicio',
      path: ['fechaFin'],
    }
  );

type TareaFormData = z.infer<typeof tareaFormSchema>;

interface TaskFormModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly proyectoId: string;
  readonly tarea?: Tarea;
  readonly onSuccess?: () => void;
}

const PRIORIDADES: { value: PrioridadTarea; label: string; color: string }[] = [
  { value: 'LOW', label: 'Baja', color: 'zinc' },
  { value: 'MEDIUM', label: 'Media', color: 'blue' },
  { value: 'HIGH', label: 'Alta', color: 'orange' },
  { value: 'URGENT', label: 'Urgente', color: 'red' },
];

export function TaskFormModal({
  open,
  onOpenChange,
  proyectoId,
  tarea,
  onSuccess,
}: TaskFormModalProps) {
  const isEdit = !!tarea;
  const createTarea = useCreateTarea();
  const updateTarea = useUpdateTarea();
  const { data: empleadosData } = useEmpleados({ activo: true, limit: 500 });
  const empleados = empleadosData?.data ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<TareaFormData>({
    resolver: zodResolver(tareaFormSchema),
    defaultValues: {
      titulo: '',
      descripcion: '',
      prioridad: 'MEDIUM',
      usuarioAsignadoId: '',
      fechaInicio: '',
      fechaFin: '',
      horasEstimadas: undefined,
    },
  });

  const prioridad = watch('prioridad');
  const usuarioAsignadoId = watch('usuarioAsignadoId');

  useEffect(() => {
    if (isEdit && tarea) {
      reset({
        titulo: tarea.titulo,
        descripcion: tarea.descripcion || '',
        prioridad: tarea.prioridad,
        usuarioAsignadoId: tarea.usuarioAsignadoId || '',
        fechaInicio: tarea.fechaInicio
          ? new Date(tarea.fechaInicio).toISOString().split('T')[0]
          : '',
        fechaFin: tarea.fechaFin ? new Date(tarea.fechaFin).toISOString().split('T')[0] : '',
        horasEstimadas: tarea.horasEstimadas ? parseFloat(tarea.horasEstimadas) : undefined,
      });
    } else {
      reset({
        titulo: '',
        descripcion: '',
        prioridad: 'MEDIUM',
        usuarioAsignadoId: '',
        fechaInicio: '',
        fechaFin: '',
        horasEstimadas: undefined,
      });
    }
  }, [isEdit, tarea, reset, open]);

  const onSubmit = async (data: TareaFormData) => {
    try {
      if (isEdit && tarea) {
        await updateTarea.mutateAsync({
          id: tarea.id,
          data: {
            titulo: data.titulo,
            descripcion: data.descripcion || undefined,
            prioridad: data.prioridad,
            usuarioAsignadoId: data.usuarioAsignadoId || undefined,
            fechaInicio: data.fechaInicio || undefined,
            fechaFin: data.fechaFin || undefined,
            horasEstimadas: data.horasEstimadas,
          },
        });
        toast.success('Tarea actualizada correctamente');
      } else {
        await createTarea.mutateAsync({
          proyectoId,
          titulo: data.titulo,
          descripcion: data.descripcion || undefined,
          prioridad: data.prioridad,
          usuarioAsignadoId: data.usuarioAsignadoId || undefined,
          fechaInicio: data.fechaInicio || undefined,
          fechaFin: data.fechaFin || undefined,
          horasEstimadas: data.horasEstimadas,
        });
        toast.success('Tarea creada correctamente');
      }
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch {
      toast.error(isEdit ? 'Error al actualizar la tarea' : 'Error al crear la tarea');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Tarea' : 'Nueva Tarea'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modifica los datos de la tarea'
              : 'Completa los datos para crear una nueva tarea'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="titulo">
              Título <span className="text-red-500">*</span>
            </Label>
            <Input
              id="titulo"
              {...register('titulo')}
              placeholder="Ej: Implementar autenticación"
              disabled={isSubmitting}
            />
            {errors.titulo && (
              <p className="text-sm text-red-500">{errors.titulo.message}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              {...register('descripcion')}
              placeholder="Detalles adicionales de la tarea..."
              rows={3}
              disabled={isSubmitting}
            />
            {errors.descripcion && (
              <p className="text-sm text-red-500">{errors.descripcion.message}</p>
            )}
          </div>

          {/* Prioridad y Usuario */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prioridad">Prioridad</Label>
              <Select
                value={prioridad}
                onValueChange={(value) => setValue('prioridad', value as PrioridadTarea)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="prioridad">
                  <SelectValue placeholder="Seleccionar prioridad" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORIDADES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.prioridad && (
                <p className="text-sm text-red-500">{errors.prioridad.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="usuarioAsignadoId">Asignado a</Label>
              <Select
                value={usuarioAsignadoId}
                onValueChange={(value) => setValue('usuarioAsignadoId', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="usuarioAsignadoId">
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin asignar</SelectItem>
                  {empleados.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.nombre} {emp.apellidos || ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.usuarioAsignadoId && (
                <p className="text-sm text-red-500">{errors.usuarioAsignadoId.message}</p>
              )}
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaInicio" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Fecha Inicio
              </Label>
              <Input
                id="fechaInicio"
                type="date"
                {...register('fechaInicio')}
                disabled={isSubmitting}
              />
              {errors.fechaInicio && (
                <p className="text-sm text-red-500">{errors.fechaInicio.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaFin" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Fecha Fin
              </Label>
              <Input
                id="fechaFin"
                type="date"
                {...register('fechaFin')}
                disabled={isSubmitting}
              />
              {errors.fechaFin && (
                <p className="text-sm text-red-500">{errors.fechaFin.message}</p>
              )}
            </div>
          </div>

          {/* Horas Estimadas */}
          <div className="space-y-2">
            <Label htmlFor="horasEstimadas">Horas Estimadas</Label>
            <Input
              id="horasEstimadas"
              type="number"
              step="0.5"
              min="0"
              {...register('horasEstimadas', { valueAsNumber: true })}
              placeholder="Ej: 8"
              disabled={isSubmitting}
            />
            {errors.horasEstimadas && (
              <p className="text-sm text-red-500">{errors.horasEstimadas.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Actualizar' : 'Crear Tarea'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
