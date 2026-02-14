import { z } from 'zod';
import { optionalBooleanFromString, uuidSchema } from '../../validators/common.js';

export const roles = ['ADMIN', 'RRHH', 'MANAGER', 'EMPLEADO'] as const;
export const categorias = [
  'DOCUMENTACION',
  'EQUIPAMIENTO',
  'ACCESOS',
  'FORMACION',
  'REUNIONES',
  'ADMINISTRATIVO',
] as const;
export const responsables = ['RRHH', 'MANAGER', 'IT', 'EMPLEADO', 'CUSTOM'] as const;

export const listQuerySchema = z.object({
  departamentoId: uuidSchema.optional(),
  activo: optionalBooleanFromString,
});

export const createPlantillaSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  departamentoId: uuidSchema.optional(),
  rolDestino: z.enum(roles).optional(),
  duracionEstimadaDias: z.number().int().positive().optional(),
  activo: z.boolean().optional(),
});

export const updatePlantillaSchema = createPlantillaSchema.partial();

const baseTareaSchema = z.object({
  titulo: z.string().min(1),
  descripcion: z.string().optional(),
  categoria: z.enum(categorias),
  // Acepta ambos campos para compatibilidad frontend/backend
  responsableTipo: z.enum(responsables).optional(),
  responsable: z.enum(responsables).optional(),
  responsableId: uuidSchema.optional(),
  diasDesdeInicio: z.number().int().optional(),
  duracionEstimadaHoras: z.number().optional(),
  orden: z.number().int(),
  obligatoria: z.boolean().optional(),
  requiereEvidencia: z.boolean().optional(),
  instrucciones: z.string().optional(),
  recursosUrl: z.array(z.string()).optional(),
  dependencias: z.array(uuidSchema).optional(),
});

export const createTareaSchema = baseTareaSchema.refine(
  (data) => data.responsableTipo || data.responsable,
  {
    message: 'Se requiere responsableTipo o responsable',
    path: ['responsableTipo'],
  }
);

export const updateTareaSchema = baseTareaSchema.partial();

export const reorderSchema = z.object({
  orderedIds: z.array(uuidSchema),
});

export const plantillaIdSchema = z.object({
  id: uuidSchema,
});

export const tareaIdSchema = z.object({
  id: uuidSchema,
  tareaId: uuidSchema,
});
