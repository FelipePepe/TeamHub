import { z } from 'zod';
import { uuidSchema, dateSchema } from './common.js';

// Estados de tarea
const estados = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED'] as const;

// Prioridades de tarea
const prioridades = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export const createTareaSchema = z.object({
  titulo: z.string().min(1, 'El título es obligatorio'),
  descripcion: z.string().optional(),
  estado: z.enum(estados).optional(),
  prioridad: z.enum(prioridades).optional(),
  usuarioAsignadoId: uuidSchema.optional(),
  fechaInicio: dateSchema.optional(),
  fechaFin: dateSchema.optional(),
  horasEstimadas: z.number().optional(),
  horasReales: z.number().optional(),
  orden: z.number().optional(),
  dependeDe: uuidSchema.optional(),
});

export const updateTareaSchema = z.object({
  titulo: z.string().min(1).optional(),
  descripcion: z.string().optional(),
  estado: z.enum(estados).optional(),
  prioridad: z.enum(prioridades).optional(),
  usuarioAsignadoId: uuidSchema.optional().nullable(),
  fechaInicio: dateSchema.optional().nullable(),
  fechaFin: dateSchema.optional().nullable(),
  horasEstimadas: z.number().optional().nullable(),
  horasReales: z.number().optional().nullable(),
  orden: z.number().optional(),
  dependeDe: uuidSchema.optional().nullable(),
});

export const updateEstadoSchema = z.object({
  estado: z.enum(estados),
});

export const reasignarTareaSchema = z.object({
  usuarioAsignadoId: uuidSchema.nullable(),
});
