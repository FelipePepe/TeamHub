import { z } from 'zod';
import { dateSchema, uuidSchema } from '../../validators/common.js';

export const estados = ['PLANIFICACION', 'ACTIVO', 'PAUSADO', 'COMPLETADO', 'CANCELADO'] as const;
export const prioridades = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'] as const;

export const listQuerySchema = z.object({
  estado: z.enum(estados).optional(),
  managerId: uuidSchema.optional(),
  cliente: z.string().optional(),
  fechaInicio: dateSchema.optional(),
  fechaFin: dateSchema.optional(),
});

export const createProyectoSchema = z.object({
  nombre: z.string().min(1),
  codigo: z.string().min(1),
  descripcion: z.string().optional(),
  cliente: z.string().optional(),
  fechaInicio: dateSchema.optional(),
  fechaFinEstimada: dateSchema.optional(),
  presupuestoHoras: z.number().optional(),
  prioridad: z.enum(prioridades).optional(),
  color: z.string().optional(),
});

export const updateProyectoSchema = z.object({
  nombre: z.string().min(1).optional(),
  descripcion: z.string().optional(),
  cliente: z.string().optional(),
  fechaInicio: dateSchema.optional(),
  fechaFinEstimada: dateSchema.optional(),
  fechaFinReal: dateSchema.optional(),
  presupuestoHoras: z.number().optional(),
  prioridad: z.enum(prioridades).optional(),
  color: z.string().optional(),
  estado: z.enum(estados).optional(),
  activo: z.boolean().optional(),
});

export const updateEstadoSchema = z.object({
  estado: z.enum(estados),
});

export const createAsignacionSchema = z.object({
  usuarioId: uuidSchema,
  rol: z.string().optional(),
  dedicacionPorcentaje: z.number().optional(),
  horasSemanales: z.number().optional(),
  fechaInicio: dateSchema,
  fechaFin: dateSchema.optional(),
  notas: z.string().optional(),
});

export const updateAsignacionSchema = z.object({
  rol: z.string().optional(),
  dedicacionPorcentaje: z.number().optional(),
  horasSemanales: z.number().optional(),
  fechaInicio: dateSchema.optional(),
  fechaFin: dateSchema.optional(),
  notas: z.string().optional(),
  activo: z.boolean().optional(),
});

export const idParamsSchema = z.object({
  id: uuidSchema,
});

export const asignacionParamsSchema = z.object({
  id: uuidSchema,
  asigId: uuidSchema,
});
