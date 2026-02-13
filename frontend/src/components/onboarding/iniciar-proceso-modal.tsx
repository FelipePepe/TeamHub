'use client';
import type { User } from '@/types';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useCreateProceso } from '@/hooks/use-procesos';
import { usePlantillas } from '@/hooks/use-plantillas';
import { useEmpleados } from '@/hooks/use-empleados';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============================================================================
// Validation Schema
// ============================================================================

const iniciarProcesoSchema = z.object({
  empleadoId: z.string().min(1, 'Selecciona un empleado'),
  plantillaId: z.string().min(1, 'Selecciona una plantilla'),
  fechaInicio: z.date({
    required_error: 'Selecciona una fecha de inicio',
  }),
  notas: z.string().optional(),
});

type IniciarProcesoFormData = z.infer<typeof iniciarProcesoSchema>;

// ============================================================================
// Props
// ============================================================================

interface IniciarProcesoModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly empleadoIdPrefill?: string;
  readonly onSuccess?: (procesoId: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export function IniciarProcesoModal({
  open,
  onOpenChange,
  empleadoIdPrefill,
  onSuccess,
}: IniciarProcesoModalProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const { data: plantillasData, isLoading: loadingPlantillas } = usePlantillas({
    activo: true,
  });
  const { data: empleadosData, isLoading: loadingEmpleados } = useEmpleados({});
  const createProceso = useCreateProceso();

  const form = useForm<IniciarProcesoFormData>({
    resolver: zodResolver(iniciarProcesoSchema),
    defaultValues: {
      empleadoId: empleadoIdPrefill || '',
      plantillaId: '',
      fechaInicio: new Date(),
      notas: '',
    },
  });

  // Reset form when modal opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  const onSubmit = async (data: IniciarProcesoFormData) => {
    try {
      const proceso = await createProceso.mutateAsync({
        empleadoId: data.empleadoId,
        plantillaId: data.plantillaId,
        fechaInicio: data.fechaInicio.toISOString(),
      });

      toast.success('Proceso de onboarding iniciado correctamente');
      handleOpenChange(false);
      
      if (onSuccess) {
        onSuccess(proceso.id);
      }
    } catch (error) {
      console.error('Error creating proceso:', error);
      toast.error('Error al iniciar el proceso');
    }
  };

  const plantillas = plantillasData?.plantillas ?? [];
  const empleados = empleadosData?.data ?? [];
  const selectedPlantilla = plantillas.find(
    (p) => p.id === form.watch('plantillaId')
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Iniciar Proceso de Onboarding</DialogTitle>
          <DialogDescription>
            Selecciona el empleado, la plantilla y la fecha de inicio para crear un
            nuevo proceso de onboarding.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Empleado */}
          <div className="space-y-2">
            <Label htmlFor="empleadoId">
              Empleado <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.watch('empleadoId')}
              onValueChange={(value) => form.setValue('empleadoId', value)}
              disabled={!!empleadoIdPrefill || loadingEmpleados}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un empleado" />
              </SelectTrigger>
              <SelectContent>
                {empleados.map((emp: User) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.nombre} {emp.apellidos} - {emp.departamentoNombre || 'Sin departamento'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.empleadoId && (
              <p className="text-sm text-destructive">
                {form.formState.errors.empleadoId.message}
              </p>
            )}
          </div>

          {/* Plantilla */}
          <div className="space-y-2">
            <Label htmlFor="plantillaId">
              Plantilla <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.watch('plantillaId')}
              onValueChange={(value) => form.setValue('plantillaId', value)}
              disabled={loadingPlantillas}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una plantilla" />
              </SelectTrigger>
              <SelectContent>
                {plantillas.map((plantilla) => (
                  <SelectItem key={plantilla.id} value={plantilla.id}>
                    <div className="flex flex-col">
                      <span>{plantilla.nombre}</span>
                      {plantilla.departamentoNombre && (
                        <span className="text-xs text-muted-foreground">
                          {plantilla.departamentoNombre}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.plantillaId && (
              <p className="text-sm text-destructive">
                {form.formState.errors.plantillaId.message}
              </p>
            )}

            {/* Plantilla info */}
            {selectedPlantilla && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <p className="font-medium">Información de la plantilla:</p>
                {selectedPlantilla.descripcion && (
                  <p className="text-muted-foreground mt-1">
                    {selectedPlantilla.descripcion}
                  </p>
                )}
                {selectedPlantilla.totalTareas && (
                  <p className="text-muted-foreground mt-1">
                    <span className="font-medium">{selectedPlantilla.totalTareas}</span>{' '}
                    {selectedPlantilla.totalTareas === 1 ? 'tarea' : 'tareas'}
                  </p>
                )}
                {selectedPlantilla.duracionEstimadaDias && (
                  <p className="text-muted-foreground">
                    Duración estimada:{' '}
                    <span className="font-medium">
                      {selectedPlantilla.duracionEstimadaDias}
                    </span>{' '}
                    días
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Fecha Inicio */}
          <div className="space-y-2">
            <Label htmlFor="fechaInicio">
              Fecha de Inicio <span className="text-destructive">*</span>
            </Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !form.watch('fechaInicio') && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch('fechaInicio') ? (
                    format(form.watch('fechaInicio'), 'PPP', { locale: es })
                  ) : (
                    <span>Selecciona una fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.watch('fechaInicio')}
                  onSelect={(date: Date | undefined) => {
                    if (date) {
                      form.setValue('fechaInicio', date);
                      setCalendarOpen(false);
                    }
                  }}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
            {form.formState.errors.fechaInicio && (
              <p className="text-sm text-destructive">
                {form.formState.errors.fechaInicio.message}
              </p>
            )}
          </div>

          {/* Notas (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea
              id="notas"
              {...form.register('notas')}
              placeholder="Notas adicionales sobre este proceso..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createProceso.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createProceso.isPending}>
              {createProceso.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Iniciar Proceso
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
