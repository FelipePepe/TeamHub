import 'dotenv/config';
import { z } from 'zod';
import { emailSchema } from '../validators/common.js';
import { passwordSchema } from '../validators/auth.js';
import { hashPassword } from '../services/auth-service.js';
import { countUsers, createUser, findUserByEmail } from '../services/users-repository.js';
import { pool } from './index.js';

const seedEnvSchema = z
  .object({
    SEED_ADMIN_EMAIL: emailSchema.optional(),
    SEED_ADMIN_PASSWORD: passwordSchema.optional(),
    SEED_ADMIN_NOMBRE: z.string().min(1).default('Admin'),
    SEED_ADMIN_APELLIDOS: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasEmail = Boolean(data.SEED_ADMIN_EMAIL);
    const hasPassword = Boolean(data.SEED_ADMIN_PASSWORD);
    if (hasEmail !== hasPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD deben definirse juntos',
      });
    }
  });

const parseSeedEnv = () => {
  const parsed = seedEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = parsed.error.issues.map((issue) => issue.message).join('\n');
    throw new Error(`Variables de seed invalidas:\n${formatted}`);
  }
  return parsed.data;
};

async function seedAdminUser() {
  const env = parseSeedEnv();
  if (!env.SEED_ADMIN_EMAIL || !env.SEED_ADMIN_PASSWORD) {
    console.log('Seed omitido: define SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD.');
    return;
  }

  const totalUsers = await countUsers();
  if (totalUsers > 0) {
    console.log('Seed omitido: la base de datos ya tiene usuarios.');
    return;
  }

  const existing = await findUserByEmail(env.SEED_ADMIN_EMAIL);
  if (existing) {
    console.log(`Seed omitido: ya existe el usuario ${env.SEED_ADMIN_EMAIL}.`);
    return;
  }

  const now = new Date();
  await createUser({
    email: env.SEED_ADMIN_EMAIL,
    nombre: env.SEED_ADMIN_NOMBRE,
    apellidos: env.SEED_ADMIN_APELLIDOS,
    rol: 'ADMIN',
    passwordHash: await hashPassword(env.SEED_ADMIN_PASSWORD),
    passwordTemporal: false,
    mfaEnabled: false,
    failedLoginAttempts: 0,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`Seed OK: usuario admin creado (${env.SEED_ADMIN_EMAIL}).`);
}

async function main() {
  try {
    await seedAdminUser();
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
