import { z } from 'zod';
import {
  emailSchema,
  optionalBooleanFromString,
  optionalNumberFromString,
  uuidSchema,
} from '../../validators/common.js';
import { passwordSchema } from '../../validators/auth.js';

export const roles = ['ADMIN', 'RRHH', 'MANAGER', 'EMPLEADO'] as const;

export const listQuerySchema = z.object({
  search: z.string().optional(),
  rol: z.enum(roles).optional(),
  departamentoId: uuidSchema.optional(),
  activo: optionalBooleanFromString,
  page: optionalNumberFromString,
  limit: optionalNumberFromString,
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  nombre: z.string().min(1),
  apellidos: z.string().optional(),
  rol: z.enum(roles).optional(),
  departamentoId: uuidSchema.optional(),
  managerId: uuidSchema.optional(),
  activo: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  nombre: z.string().min(1).optional(),
  apellidos: z.string().optional(),
  rol: z.enum(roles).optional(),
  departamentoId: uuidSchema.optional(),
  managerId: uuidSchema.optional(),
  activo: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: passwordSchema,
});

export const idParamsSchema = z.object({
  id: uuidSchema,
});
