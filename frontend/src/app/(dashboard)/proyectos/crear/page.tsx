'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateProyecto } from '@/hooks/use-proyectos';
import { usePermissions } from '@/hooks/use-permissions';
import { toast } from 'sonner';
import type { ProyectoPrioridad } from '@/hooks/use-proyectos';

/** Esquema de validación alineado con CreateProyectoRequest (OpenAPI) */
const crearProyectoSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(200),
  codigo: z.string().min(1, 'Código requerido').max(50).regex(/^[A-Z0-9_-]+$/i, 'Solo letras, números, guiones y guiones bajos'),
  descripcion: z.string().max(2000).optional(),
  cliente: z.string().max(200).optional(),
  fechaInicio: z.string().optional(),
  fechaFinEstimada: z.string().optional(),
  presupuestoHoras: z.coerce.number().min(0).optional(),
  prioridad: z.enum(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().or(z.literal('')),
});

type CrearProyectoFormData = z.infer<typeof crearProyectoSchema>;

const PRIORIDADES: { value: ProyectoPrioridad; label: string }[] = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' },
];

export default function CrearProyectoPage() {
  const router = useRouter();
  const { canManageProjects } = usePermissions();
  const createProyecto = useCreateProyecto();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CrearProyectoFormData>({
    resolver: zodResolver(crearProyectoSchema),
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
    },
  });

  const prioridad = watch('prioridad');
  const color = watch('color');

  if (!canManageProjects) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acceso denegado</CardTitle>
            <CardDescription>No tienes permisos para crear proyectos</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const onSubmit = async (data: CrearProyectoFormData) => {
    try {
      const payload = {
        nombre: data.nombre,
        codigo: data.codigo.toUpperCase(),
        descripcion: data.descripcion || undefined,
        cliente: data.cliente || undefined,
        fechaInicio: data.fechaInicio || undefined,
        fechaFinEstimada: data.fechaFinEstimada || undefined,
        presupuestoHoras: data.presupuestoHoras,
        prioridad: data.prioridad,
        color: data.color || undefined,
      };
      const proyecto = await createProyecto.mutateAsync(payload);
      toast.success('Proyecto creado correctamente');
      router.push(`/proyectos/${proyecto.id}`);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'error' in err ? (err as { error: string }).error : 'Error al crear proyecto';
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Crear proyecto</h1>
          <p className="text-slate-500">Datos del nuevo proyecto (contrato OpenAPI CreateProyectoRequest)</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del proyecto</CardTitle>
          <CardDescription>Nombre y código son obligatorios</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input id="nombre" {...register('nombre')} placeholder="Ej: Portal interno" />
                {errors.nombre && <p className="text-sm text-red-500">{errors.nombre.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  className="uppercase"
                  {...register('codigo', {
                    onChange: (e) => { e.target.value = e.target.value.toUpperCase(); },
                  })}
                  placeholder="Ej: PORTAL-01"
                />
                {errors.codigo && <p className="text-sm text-red-500">{errors.codigo.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <textarea
                id="descripcion"
                rows={3}
                className="flex min-h-[60px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm"
                {...register('descripcion')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Input id="cliente" {...register('cliente')} placeholder="Opcional" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fechaInicio">Fecha inicio</Label>
                <Input id="fechaInicio" type="date" {...register('fechaInicio')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaFinEstimada">Fecha fin estimada</Label>
                <Input id="fechaFinEstimada" type="date" {...register('fechaFinEstimada')} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="presupuestoHoras">Presupuesto (horas)</Label>
                <Input id="presupuestoHoras" type="number" min={0} {...register('presupuestoHoras')} />
              </div>
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select value={prioridad ?? ''} onValueChange={(v) => setValue('prioridad', v as ProyectoPrioridad)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
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
                  value={color || '#3b82f6'}
                  onChange={(e) => setValue('color', e.target.value)}
                />
                <Input
                  placeholder="#3b82f6"
                  value={color || ''}
                  onChange={(e) => setValue('color', e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting || createProyecto.isPending}>
                {(isSubmitting || createProyecto.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear proyecto
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
