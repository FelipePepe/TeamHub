import { z } from 'zod';
import { emailSchema } from './common';

export const passwordSchema = z
  .string()
  .min(12)
  .max(128)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/[0-9]/)
  .regex(/[^A-Za-z0-9]/);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});
