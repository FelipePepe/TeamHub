import { z } from 'zod';
import {
  dateSchema,
  optionalBooleanFromString,
  optionalNumberFromString,
  uuidSchema,
} from '../../validators/common.js';

export const estados = ['PENDIENTE', 'APROBADO', 'RECHAZADO'] as const;

export const listQuerySchema = z.object({
  usuarioId: uuidSchema.optional(),
  proyectoId: uuidSchema.optional(),
  estado: z.enum(estados).optional(),
  fechaInicio: dateSchema.optional(),
  fechaFin: dateSchema.optional(),
  facturable: optionalBooleanFromString,
  page: optionalNumberFromString,
  limit: optionalNumberFromString,
});

export const createRegistroSchema = z.object({
  proyectoId: uuidSchema,
  usuarioId: uuidSchema.optional(),
  fecha: dateSchema,
  horas: z.number().positive().max(24),
  descripcion: z.string().min(1),
  facturable: z.boolean().optional(),
});

export const updateRegistroSchema = z.object({
  fecha: dateSchema.optional(),
  horas: z.number().positive().max(24).optional(),
  descripcion: z.string().min(1).optional(),
  facturable: z.boolean().optional(),
});

export const approveSchema = z
  .object({
    comentario: z.string().optional(),
  })
  .optional();

export const rejectSchema = z.object({
  comentario: z.string().min(1),
});

export const bulkApproveSchema = z.object({
  ids: z.array(uuidSchema),
});

export const copySchema = z.object({
  fechaOrigen: dateSchema,
  fechaDestino: dateSchema,
});

export const idParamsSchema = z.object({
  id: uuidSchema,
});

export const semanaParamsSchema = z.object({
  fecha: dateSchema,
});
