import { z } from 'zod';
import { emailSchema } from '../../validators/common.js';
import { passwordSchema } from '../../validators/auth.js';

export const mfaVerifySchema = z.object({
  mfaToken: z.string().min(1),
  code: z.string().regex(/^\d{6}$/),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutSchema = z
  .object({
    refreshToken: z.string().min(1).optional(),
  })
  .optional();

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
});

export const changePasswordSchema = z.object({
  mfaToken: z.string().min(1),
  newPassword: passwordSchema,
});
