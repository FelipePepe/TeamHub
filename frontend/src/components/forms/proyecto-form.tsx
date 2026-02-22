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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateProyecto, useProyecto, useUpdateProyecto } from '@/hooks/use-proyectos';
import type { CreateProyectoData, Proyecto, ProyectoPrioridad, UpdateProyectoData } from '@/hooks/use-proyectos';
import { useDepartamentos } from '@/hooks/use-departamentos';
import type { Departamento } from '@/hooks/use-departamentos';

/** Esquema de validación alineado con CreateProyectoRequest (OpenAPI). */
const proyectoSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(200),
  codigo: z
    .string()
    .min(1, 'Código requerido')
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, 'Solo letras, números, guiones y guiones bajos'),
  descripcion: z.string().max(2000).optional(),
  cliente: z.string().max(200).optional(),
  fechaInicio: z.string().optional(),
  fechaFinEstimada: z.string().optional(),
  presupuestoHoras: z.coerce.number().min(0).optional(),
  prioridad: z.enum(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().or(z.literal('')),
  departamentoIds: z.array(z.string()).optional(),
});

type ProyectoFormData = z.infer<typeof proyectoSchema>;

const PRIORIDADES: { value: ProyectoPrioridad; label: string }[] = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' },
];

const PRIORIDAD_NONE = '__none__';

/**
 * Extrae un mensaje de error de API sin type assertions.
 */
function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'error' in error) {
    const maybeError = error.error;
    if (typeof maybeError === 'string' && maybeError.length > 0) {
      return maybeError;
    }
  }

  return fallback;
}

interface ProyectoFormProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSuccess?: () => void;
  /** Si se proporciona, el formulario abre en modo edición pre-relleno con los datos del proyecto. */
  readonly proyecto?: Proyecto;
}

/**
 * Construye el payload normalizado para la creación de proyectos.
 * @param data - Datos del formulario validados por Zod.
 * @returns Payload listo para la API de creación de proyectos.
 */
function buildCreatePayload(data: ProyectoFormData): CreateProyectoData {
  return {
    nombre: data.nombre,
    codigo: data.codigo.trim().toUpperCase(),
    descripcion: data.descripcion || undefined,
    cliente: data.cliente || undefined,
    fechaInicio: data.fechaInicio || undefined,
    fechaFinEstimada: data.fechaFinEstimada || undefined,
    presupuestoHoras: data.presupuestoHoras,
    prioridad: data.prioridad,
    color: data.color || undefined,
    departamentoIds: data.departamentoIds && data.departamentoIds.length > 0
      ? data.departamentoIds
      : undefined,
  };
}

/**
 * Construye el payload normalizado para la actualización de proyectos.
 * @param data - Datos del formulario validados por Zod.
 * @returns Payload listo para la API de actualización de proyectos.
 */
function buildUpdatePayload(data: ProyectoFormData): UpdateProyectoData {
  return {
    nombre: data.nombre,
    descripcion: data.descripcion || undefined,
    cliente: data.cliente || undefined,
    fechaInicio: data.fechaInicio || undefined,
    fechaFinEstimada: data.fechaFinEstimada || undefined,
    presupuestoHoras: data.presupuestoHoras,
    prioridad: data.prioridad,
    color: data.color || undefined,
    departamentoIds: data.departamentoIds ?? [],
  };
}

/**
 * Renderiza un formulario modal para crear o editar proyectos con validación.
 * @param open - Si el modal está abierto.
 * @param onOpenChange - Callback cuando cambia el estado del modal.
 * @param onSuccess - Callback opcional al completar la operación.
 * @param proyecto - Si se proporciona, abre en modo edición pre-relleno.
 * @returns Modal con formulario de creación/edición de proyectos.
 */
export function ProyectoForm({ open, onOpenChange, onSuccess, proyecto }: ProyectoFormProps) {
  const isEdit = !!proyecto;
  const createProyecto = useCreateProyecto();
  const updateProyecto = useUpdateProyecto();
  const { data: departamentosData } = useDepartamentos();
  // Fetch full project detail to get departamentoIds (the list endpoint doesn't include them)
  const { data: proyectoDetail } = useProyecto(proyecto?.id ?? '', isEdit && !!proyecto?.id);
  const departamentosDisponibles: Departamento[] = departamentosData?.data ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<ProyectoFormData>({
    resolver: zodResolver(proyectoSchema),
    defaultValues: {
      nombre: '',
      codigo: '',
      descripcion: '',
      cliente: '',
      fechaInicio: '',
      fechaFinEstimada: '',
      presupuestoHoras: undefined,
      prioridad: undefined,
      color: '',
      departamentoIds: [],
    },
  });

  const prioridad = watch('prioridad');
  const color = watch('color');
  const selectedDepartamentoIds = watch('departamentoIds') ?? [];

  const isLoading = isSubmitting || createProyecto.isPending || updateProyecto.isPending;

  /**
   * Pre-rellena el formulario cuando se abre en modo edición.
   */
  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      // Prefer the full detail response (has departamentoIds) over the list item (may not have them)
      const source = proyectoDetail ?? proyecto;
      reset({
        nombre: source.nombre,
        codigo: source.codigo,
        descripcion: source.descripcion ?? '',
        cliente: source.cliente ?? '',
        fechaInicio: source.fechaInicio ?? '',
        fechaFinEstimada: source.fechaFinEstimada ?? '',
        presupuestoHoras: source.presupuestoHoras,
        prioridad: source.prioridad,
        color: source.color ?? '',
        departamentoIds: source.departamentoIds ?? [],
      });
    } else {
      reset({
        nombre: '',
        codigo: '',
        descripcion: '',
        cliente: '',
        fechaInicio: '',
        fechaFinEstimada: '',
        presupuestoHoras: undefined,
        prioridad: undefined,
        color: '',
        departamentoIds: [],
      });
    }
  }, [open, isEdit, proyecto, proyectoDetail, reset]);

  /**
   * Alterna la selección de un departamento en el formulario.
   * @param departamentoId - UUID del departamento a añadir o eliminar.
   */
  const toggleDepartamento = (departamentoId: string) => {
    const current = selectedDepartamentoIds;
    const updated = current.includes(departamentoId)
      ? current.filter((id) => id !== departamentoId)
      : [...current, departamentoId];
    setValue('departamentoIds', updated, { shouldValidate: true });
  };

  /**
   * Maneja el envío del formulario y crea el proyecto en la API.
   * @param data - Datos del formulario validados por Zod.
   * @returns Promesa resuelta al completar la creación.
   */
  const onSubmit = async (data: ProyectoFormData) => {
    try {
      if (isEdit) {
        await updateProyecto.mutateAsync({ id: proyecto.id, data: buildUpdatePayload(data) });
        toast.success('Proyecto actualizado correctamente');
      } else {
        await createProyecto.mutateAsync(buildCreatePayload(data));
        toast.success('Proyecto creado correctamente');
      }
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, isEdit ? 'Error al actualizar proyecto' : 'Error al crear proyecto');
      toast.error(msg);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          reset();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar proyecto' : 'Crear proyecto'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Modifica los datos del proyecto' : 'Completa los datos para crear un nuevo proyecto'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input id="nombre" placeholder="Ej: Portal interno" disabled={isLoading} {...register('nombre')} />
              {errors.nombre && <p className="text-sm text-red-500">{errors.nombre.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo">
                Código <span className="text-red-500">*</span>
              </Label>
              <Input
                id="codigo"
                className="uppercase"
                disabled={isLoading || isEdit}
                readOnly={isEdit}
                {...register('codigo', {
                  onChange: (e) => {
                    if (!isEdit) e.target.value = e.target.value.toUpperCase();
                  },
                })}
                placeholder="Ej: PORTAL-01"
              />
              {isEdit && (
                <p className="text-xs text-muted-foreground">El código no se puede modificar.</p>
              )}
              {errors.codigo && <p className="text-sm text-red-500">{errors.codigo.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              rows={3}
              disabled={isLoading}
              placeholder="Descripción del proyecto..."
              {...register('descripcion')}
            />
            {errors.descripcion && <p className="text-sm text-red-500">{errors.descripcion.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente</Label>
            <Input id="cliente" disabled={isLoading} {...register('cliente')} placeholder="Opcional" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fechaInicio">Fecha inicio</Label>
              <Input id="fechaInicio" type="date" disabled={isLoading} {...register('fechaInicio')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaFinEstimada">Fecha fin estimada</Label>
              <Input id="fechaFinEstimada" type="date" disabled={isLoading} {...register('fechaFinEstimada')} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="presupuestoHoras">Presupuesto (horas)</Label>
              <Input
                id="presupuestoHoras"
                type="number"
                min={0}
                disabled={isLoading}
                {...register('presupuestoHoras')}
              />
              {errors.presupuestoHoras && (
                <p className="text-sm text-red-500">{errors.presupuestoHoras.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select
                value={prioridad ?? PRIORIDAD_NONE}
                onValueChange={(value) =>
                  setValue('prioridad', value === PRIORIDAD_NONE ? undefined : (value as ProyectoPrioridad), {
                    shouldValidate: true,
                  })
                }
                disabled={isLoading}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={PRIORIDAD_NONE}>Sin prioridad</SelectItem>
                  {PRIORIDADES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                className="h-10 w-14 cursor-pointer"
                disabled={isLoading}
                value={color || '#3b82f6'}
                onChange={(e) => setValue('color', e.target.value, { shouldValidate: true })}
              />
              <Input
                placeholder="#3b82f6"
                disabled={isLoading}
                value={color || ''}
                maxLength={7}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                    setValue('color', value, { shouldValidate: true });
                  }
                }}
              />
            </div>
            {errors.color && <p className="text-sm text-red-500">{errors.color.message}</p>}
          </div>

          {departamentosDisponibles.length > 0 && (
            <div className="space-y-2">
              <Label>Departamentos</Label>
              <p className="text-xs text-muted-foreground">
                Selecciona los departamentos que participan en el proyecto. Solo se podrán asignar
                empleados de esos departamentos.
              </p>
              <div className="max-h-40 overflow-y-auto rounded-md border border-input p-2 space-y-1">
                {departamentosDisponibles.map((dept) => {
                  const checked = selectedDepartamentoIds.includes(dept.id);
                  return (
                    <label
                      key={dept.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={isLoading}
                        onChange={() => toggleDepartamento(dept.id)}
                        className="h-4 w-4 rounded border-gray-300 accent-primary"
                      />
                      <span>{dept.nombre}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Guardar cambios' : 'Crear proyecto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
