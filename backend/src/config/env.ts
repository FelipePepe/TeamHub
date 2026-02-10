import { z } from 'zod';
import { config as loadEnv } from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../');
const envPath = process.env.DOTENV_CONFIG_PATH ?? resolve(backendRoot, '.env');
loadEnv({ path: envPath });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  CORS_ORIGINS: z.string().min(1).refine((v) => !v.includes('*'), { message: 'Wildcard (*) not allowed in CORS_ORIGINS' }),
  APP_BASE_URL: z.string().url(),
  JWT_ACCESS_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/, 'Must be a duration like 15m, 1h, 30d').default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().positive().default(12),
  MFA_ISSUER: z.string().default('TeamHub'),
  MFA_ENCRYPTION_KEY: z.string().min(32),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  VERCEL: z.string().optional(),
  RENDER: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  LOGIN_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  PG_SSL_CERT_PATH: z.string().optional(),
  PG_SSL_CERT_BASE64: z.string().optional(),
  PG_SSL_REJECT_UNAUTHORIZED: z.coerce.boolean().default(true),
  BOOTSTRAP_TOKEN: z.string().min(32).optional(),
  API_HMAC_SECRET: z.string().min(32),
  DISABLE_HMAC: z.coerce.boolean().default(false),  // Explicit flag for disabling HMAC in tests
  
  // Sentry Error Tracking (optional)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().default('development'),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === 'production') {
    const secretFields = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'MFA_ENCRYPTION_KEY', 'API_HMAC_SECRET'] as const;
    for (const field of secretFields) {
      if (data[field].includes('change-me')) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: `${field} must be changed from default placeholder in production` });
      }
    }
    
    // Prevent DISABLE_HMAC=true in production
    if (data.DISABLE_HMAC) {
      ctx.addIssue({ 
        code: z.ZodIssueCode.custom, 
        path: ['DISABLE_HMAC'], 
        message: 'DISABLE_HMAC cannot be true in production environment' 
      });
    }
  }
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
