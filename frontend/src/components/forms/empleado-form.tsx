'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

/**
 * Genera una contraseña temporal segura que cumple con los requisitos del backend
 * - Mínimo 12 caracteres
 * - Al menos una mayúscula, una minúscula, un número y un carácter especial
 */
function generateTempPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%&*';
  const all = uppercase + lowercase + numbers + special;

  const getSecureRandom = (max: number): number => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  };

  // Generar caracteres aleatorios
  const chars: string[] = new Array(12);
  for (let i = 0; i < 12; i++) {
    chars[i] = all[getSecureRandom(all.length)];
  }

  // Insertar caracteres requeridos en posiciones aleatorias
  const requiredSets = [uppercase, lowercase, numbers, special];
  const usedPositions: number[] = [];
  for (const set of requiredSets) {
    let pos: number;
    do {
      pos = getSecureRandom(12);
    } while (usedPositions.includes(pos));
    usedPositions.push(pos);
    chars[pos] = set[getSecureRandom(set.length)];
  }

  // Fisher-Yates shuffle con crypto
  for (let i = chars.length - 1; i > 0; i--) {
    const j = getSecureRandom(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useCreateEmpleado, useUpdateEmpleado } from '@/hooks/use-empleados';
import { useDepartamentos } from '@/hooks/use-departamentos';
import { toast } from 'sonner';
import type { User } from '@/types';

// ============================================================================
// Schema de Validación
// ============================================================================

const empleadoFormSchema = z.object({
  email: z.string().email('Email inválido'),
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(50, 'Máximo 50 caracteres'),
  apellidos: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  rol: z.enum(['ADMIN', 'RRHH', 'MANAGER', 'EMPLEADO'], {
    errorMap: () => ({ message: 'Rol inválido' }),
  }),
  departamentoId: z.string().uuid('Selecciona un departamento').optional(),
  managerId: z.string().uuid('Manager ID inválido').optional().nullable(),
  telefono: z.string().optional(),
  fechaNacimiento: z.string().optional(), // YYYY-MM-DD
});

type EmpleadoFormData = z.infer<typeof empleadoFormSchema>;

// ============================================================================
// Props del Componente
// ============================================================================

interface EmpleadoFormProps {
  /**
   * Si está abierto el modal
   */
  readonly open: boolean;
  /**
   * Callback para cerrar el modal
   */
  readonly onOpenChange: (open: boolean) => void;
  /**
   * Empleado a editar (opcional - si no se pasa, es modo crear)
   */
  readonly empleado?: User;
  /**
   * Callback que se ejecuta después de crear/actualizar con éxito
   */
  readonly onSuccess?: () => void;
}

// ============================================================================
// Componente
// ============================================================================

/**
 * Formulario modal para crear o editar un empleado
 * 
 * @example
 * ```tsx
 * // Modo crear
 * <EmpleadoForm
 *   open={showModal}
 *   onOpenChange={setShowModal}
 *   onSuccess={() => toast.success('Empleado creado')}
 * />
 * 
 * // Modo editar
 * <EmpleadoForm
 *   open={showModal}
 *   onOpenChange={setShowModal}
 *   empleado={selectedEmpleado}
 *   onSuccess={() => toast.success('Empleado actualizado')}
 * />
 * ```
 */
export function EmpleadoForm({ open, onOpenChange, empleado, onSuccess }: EmpleadoFormProps) {
  const isEditMode = !!empleado;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EmpleadoFormData>({
    resolver: zodResolver(empleadoFormSchema),
    defaultValues: {
      email: '',
      nombre: '',
      apellidos: '',
      rol: 'EMPLEADO',
      departamentoId: undefined,
      managerId: null,
      telefono: '',
      fechaNacimiento: '',
    },
  });

  const createEmpleado = useCreateEmpleado();
  const updateEmpleado = useUpdateEmpleado();
  const { data: departamentos } = useDepartamentos({ activo: true });

  // Resetear formulario cuando se abre/cierra o cambia el empleado
  useEffect(() => {
    if (open) {
      if (empleado) {
        // Modo editar: poblar con datos existentes
        reset({
          email: empleado.email,
          nombre: empleado.nombre,
          apellidos: empleado.apellidos,
          rol: empleado.rol,
          departamentoId: empleado.departamentoId || undefined,
          managerId: empleado.managerId || null,
          telefono: empleado.telefono || '',
          fechaNacimiento: empleado.fechaNacimiento || '',
        });
      } else {
        // Modo crear: resetear a valores por defecto
        reset({
          email: '',
          nombre: '',
          apellidos: '',
          rol: 'EMPLEADO',
          departamentoId: undefined,
          managerId: null,
          telefono: '',
          fechaNacimiento: '',
        });
      }
    }
  }, [open, empleado, reset]);

  const onSubmit = async (data: EmpleadoFormData) => {
    try {
      if (isEditMode && empleado) {
        // Actualizar empleado existente
        await updateEmpleado.mutateAsync({
          id: empleado.id,
          data: {
            nombre: data.nombre,
            apellidos: data.apellidos,
            rol: data.rol,
            departamentoId: data.departamentoId || undefined,
            managerId: data.managerId || undefined,
            telefono: data.telefono || undefined,
            fechaNacimiento: data.fechaNacimiento || undefined,
          },
        });
        toast.success('Empleado actualizado correctamente');
      } else {
        // Crear nuevo empleado con contraseña temporal
        await createEmpleado.mutateAsync({
          email: data.email,
          password: generateTempPassword(),
          nombre: data.nombre,
          apellidos: data.apellidos,
          rol: data.rol,
          departamentoId: data.departamentoId || undefined,
          managerId: data.managerId || undefined,
          telefono: data.telefono || undefined,
          fechaNacimiento: data.fechaNacimiento || undefined,
        });
        toast.success('Empleado creado correctamente');
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al guardar empleado';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar empleado' : 'Crear nuevo empleado'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Modifica los datos del empleado. Los campos con * son obligatorios.'
              : 'Completa los datos del nuevo empleado. Los campos con * son obligatorios.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email (solo en modo crear) */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="juan.perez@example.com"
                {...register('email')}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Se enviará un email con contraseña temporal
              </p>
            </div>
          )}

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre"
              placeholder="Juan"
              {...register('nombre')}
              disabled={isSubmitting}
            />
            {errors.nombre && (
              <p className="text-sm text-red-500">{errors.nombre.message}</p>
            )}
          </div>

          {/* Apellidos */}
          <div className="space-y-2">
            <Label htmlFor="apellidos">
              Apellidos <span className="text-red-500">*</span>
            </Label>
            <Input
              id="apellidos"
              placeholder="Pérez García"
              {...register('apellidos')}
              disabled={isSubmitting}
            />
            {errors.apellidos && (
              <p className="text-sm text-red-500">{errors.apellidos.message}</p>
            )}
          </div>

          {/* Rol */}
          <div className="space-y-2">
            <Label htmlFor="rol">
              Rol <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch('rol')}
              onValueChange={(value) =>
                setValue('rol', value as 'ADMIN' | 'RRHH' | 'MANAGER' | 'EMPLEADO')
              }
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMPLEADO">Empleado</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="RRHH">RRHH</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            {errors.rol && (
              <p className="text-sm text-red-500">{errors.rol.message}</p>
            )}
          </div>

          {/* Departamento */}
          <div className="space-y-2">
            <Label htmlFor="departamentoId">Departamento</Label>
            <Select
              value={watch('departamentoId') || 'none'}
              onValueChange={(value) =>
                setValue('departamentoId', value === 'none' ? undefined : value)
              }
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin departamento</SelectItem>
                {departamentos?.data?.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.departamentoId && (
              <p className="text-sm text-red-500">{errors.departamentoId.message}</p>
            )}
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              type="tel"
              placeholder="+34 600 123 456"
              {...register('telefono')}
              disabled={isSubmitting}
            />
          </div>

          {/* Fecha de nacimiento */}
          <div className="space-y-2">
            <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
            <Input
              id="fechaNacimiento"
              type="date"
              {...register('fechaNacimiento')}
              disabled={isSubmitting}
            />
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
              {isEditMode ? 'Guardar cambios' : 'Crear empleado'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
