import { z } from 'zod';
import { dateSchema, uuidSchema } from '../../validators/common.js';

export const estados = ['EN_CURSO', 'COMPLETADO', 'CANCELADO', 'PAUSADO'] as const;
export const tareasEstado = ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA', 'BLOQUEADA', 'CANCELADA'] as const;
export const prioridades = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'] as const;

export const listQuerySchema = z.object({
  estado: z.enum(estados).optional(),
  empleadoId: uuidSchema.optional(),
  departamentoId: uuidSchema.optional(),
});

export const createProcesoSchema = z.object({
  empleadoId: uuidSchema,
  plantillaId: uuidSchema,
  fechaInicio: dateSchema,
});

export const updateProcesoSchema = z.object({
  fechaInicio: dateSchema.optional(),
  fechaFinEsperada: dateSchema.optional(),
  notas: z.string().optional(),
  estado: z.enum(estados).optional(),
});

export const cancelProcesoSchema = z.object({
  motivo: z.string().optional(),
});

export const updateTareaSchema = z.object({
  estado: z.enum(tareasEstado).optional(),
  prioridad: z.enum(prioridades).optional(),
  notas: z.string().optional(),
});

export const completarTareaSchema = z.object({
  evidenciaUrl: z.string().optional(),
  notas: z.string().optional(),
});

export const idParamsSchema = z.object({
  id: uuidSchema,
});

export const tareaParamsSchema = z.object({
  id: uuidSchema,
  tareaId: uuidSchema,
});

export const empleadoParamsSchema = z.object({
  empleadoId: uuidSchema,
});
