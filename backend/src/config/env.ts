import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  CORS_ORIGINS: z.string().min(1),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().min(1),
  APP_BASE_URL: z.string().url(),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().positive().default(12),
  MFA_ISSUER: z.string().default('TeamHub'),
  MFA_ENCRYPTION_KEY: z.string().min(32),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  LOGIN_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  PG_SSL_CERT_PATH: z.string().optional(),
  BOOTSTRAP_TOKEN: z.string().min(32).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment variables:\n${formatted}`);
}

const env = parsed.data;

export const config = {
  ...env,
  corsOrigins: env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean),
};
