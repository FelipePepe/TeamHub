import { Hono, type Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { createRateLimiter, getRateLimitIp } from '../middleware/rate-limit';
import { parseJson } from '../validators/parse';
import { loginSchema, passwordSchema } from '../validators/auth';
import { emailSchema } from '../validators/common';
import {
  createAccessToken,
  createMfaToken,
  createRefreshToken,
  createResetToken,
  findResetTokenRecord,
  hashPassword,
  markResetTokenUsed,
  revokeAllRefreshTokensForUser,
  revokeRefreshToken,
  verifyAccessToken,
  verifyMfaToken,
  verifyPassword,
  verifyRefreshToken,
} from '../services/auth-service';
import { decryptMfaSecret, encryptMfaSecret, generateMfaSecret, verifyTotpCode } from '../services/mfa-service';
import { toUserResponse } from '../services/mappers';
import { config } from '../config/env';
import { BUSINESS_RULES } from '../shared/constants/business-rules';
import type { User } from '../db/schema/users';
import {
  countUsers,
  createUser,
  findActiveUserById,
  findUserByEmail,
  findUserById,
  updateUserById,
} from '../services/users-repository';

const mfaVerifySchema = z.object({
  mfaToken: z.string().min(1),
  code: z.string().regex(/^\d{6}$/),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const logoutSchema = z
  .object({
    refreshToken: z.string().min(1).optional(),
  })
  .optional();

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
});

const changePasswordSchema = z.object({
  mfaToken: z.string().min(1),
  newPassword: passwordSchema,
});

const isUniqueViolation = (error: unknown) => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  );
};

const bootstrapUser = async (email: string, password: string): Promise<User> => {
  const now = new Date();
  try {
    const user = await createUser({
      email,
      nombre: 'Admin',
      rol: 'ADMIN',
      passwordHash: await hashPassword(password),
      mfaEnabled: false,
      failedLoginAttempts: 0,
      createdAt: now,
      updatedAt: now,
    });
    if (!user) {
      throw new HTTPException(500, { message: 'Error al crear usuario inicial' });
    }
    return user;
  } catch (error) {
    if (isUniqueViolation(error)) {
      const existing = await findUserByEmail(email);
      if (existing) {
        return existing;
      }
    }
    throw error;
  }
};

export const authRoutes = new Hono();

const loginRateLimit = createRateLimiter({
  windowMs: config.LOGIN_RATE_LIMIT_WINDOW_MS,
  max: config.LOGIN_RATE_LIMIT_MAX,
  keyGenerator: (c) => `ip:${getRateLimitIp(c)}`,
  message: 'Too many login attempts',
});

const isAccountLocked = (user: User) => {
  if (!user.lockedUntil) return false;
  return new Date(user.lockedUntil).getTime() > Date.now();
};

const registerFailedLogin = async (user: User) => {
  const { loginMaxAttempts, loginLockoutMinutes } = BUSINESS_RULES.auth;
  const failedLoginAttempts = user.failedLoginAttempts + 1;
  const updates: Partial<User> = {
    failedLoginAttempts,
    updatedAt: new Date(),
  };
  if (failedLoginAttempts >= loginMaxAttempts) {
    updates.lockedUntil = new Date(Date.now() + loginLockoutMinutes * 60 * 1000);
  }
  await updateUserById(user.id, updates);
};

const resetLoginFailures = async (user: User) => {
  if (user.failedLoginAttempts === 0 && !user.lockedUntil) return;
  await updateUserById(user.id, {
    failedLoginAttempts: 0,
    lockedUntil: null,
    updatedAt: new Date(),
  });
};

const authenticateForMfaSetup = async (c: Context) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'No autorizado' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  try {
    const payload = verifyAccessToken(token);
    const user = await findActiveUserById(payload.sub);
    if (!user) {
      throw new HTTPException(401, { message: 'No autorizado' });
    }
    return user;
  } catch {
    try {
      const payload = verifyMfaToken(token);
      if (payload.type !== 'mfa') {
        throw new HTTPException(401, { message: 'No autorizado' });
      }
      const user = await findActiveUserById(payload.sub);
      if (!user) {
        throw new HTTPException(401, { message: 'No autorizado' });
      }
      return user;
    } catch {
      throw new HTTPException(401, { message: 'No autorizado' });
    }
  }
};

authRoutes.use('/login', loginRateLimit);

authRoutes.post('/login', async (c) => {
  const payload = await parseJson(c, loginSchema);

  let user = await findUserByEmail(payload.email);
  if (!user) {
    const totalUsers = await countUsers();
    if (totalUsers === 0) {
    user = await bootstrapUser(payload.email, payload.password);
    }
  }

  if (!user || user.deletedAt) {
    throw new HTTPException(401, { message: 'No autorizado' });
  }

  if (user.lockedUntil && new Date(user.lockedUntil).getTime() <= Date.now()) {
    await resetLoginFailures(user);
  }

  if (isAccountLocked(user)) {
    throw new HTTPException(401, { message: 'No autorizado' });
  }

  const validPassword = await verifyPassword(payload.password, user.passwordHash);
  if (!validPassword) {
    await registerFailedLogin(user);
    throw new HTTPException(401, { message: 'No autorizado' });
  }

  await resetLoginFailures(user);

  const mfaToken = createMfaToken(user);

  // Si tiene contraseña temporal, debe cambiarla antes de MFA
  if (user.passwordTemporal) {
    return c.json({
      passwordChangeRequired: true,
      mfaToken,
    });
  }

  // Si no tiene MFA configurado, debe configurarlo
  if (!user.mfaEnabled || !user.mfaSecret) {
    return c.json({
      mfaSetupRequired: true,
      mfaToken,
    });
  }

  return c.json({
    mfaRequired: true,
    mfaToken,
  });
});

authRoutes.post('/mfa/verify', async (c) => {
  const payload = await parseJson(c, mfaVerifySchema);
  let tokenPayload: { sub: string; type: string };
  try {
    tokenPayload = verifyMfaToken(payload.mfaToken);
  } catch {
    throw new HTTPException(401, { message: 'No autorizado' });
  }
  if (!tokenPayload || tokenPayload.type !== 'mfa') {
    throw new HTTPException(401, { message: 'No autorizado' });
  }

  const user = await findActiveUserById(tokenPayload.sub);
  if (!user) {
    throw new HTTPException(401, { message: 'No autorizado' });
  }

  if (!user.mfaSecret) {
    throw new HTTPException(401, { message: 'No autorizado' });
  }

  const decryptedSecret = decryptMfaSecret(user.mfaSecret);
  const validCode = verifyTotpCode(decryptedSecret, payload.code);
  if (!validCode) {
    throw new HTTPException(401, { message: 'No autorizado' });
  }

  if (!user.mfaEnabled) {
    await updateUserById(user.id, { mfaEnabled: true, updatedAt: new Date() });
  }

  const accessToken = createAccessToken(user);
  const refreshToken = await createRefreshToken(user);

  return c.json({
    accessToken,
    refreshToken,
    user: toUserResponse(user),
    recoveryCodes: [],
  });
});

authRoutes.post('/mfa/setup', async (c) => {
  const user = await authenticateForMfaSetup(c);
  if (user.mfaEnabled && user.mfaSecret) {
    throw new HTTPException(409, { message: 'MFA ya está habilitado' });
  }
  const secret = generateMfaSecret();
  const otpauthUrl = `otpauth://totp/${encodeURIComponent(config.MFA_ISSUER)}:${encodeURIComponent(
    user.email
  )}?secret=${secret}&issuer=${encodeURIComponent(config.MFA_ISSUER)}`;

  const encryptedSecret = encryptMfaSecret(secret);
  await updateUserById(user.id, { mfaSecret: encryptedSecret, updatedAt: new Date() });

  return c.json({ secret, otpauthUrl });
});

authRoutes.post('/refresh', async (c) => {
  const payload = await parseJson(c, refreshSchema);
  let tokenPayload: { sub: string };
  try {
    tokenPayload = await verifyRefreshToken(payload.refreshToken);
  } catch {
    throw new HTTPException(401, { message: 'No autorizado' });
  }

  const user = await findActiveUserById(tokenPayload.sub);
  if (!user) {
    throw new HTTPException(401, { message: 'No autorizado' });
  }

  await revokeRefreshToken(payload.refreshToken);

  const accessToken = createAccessToken(user);
  const refreshToken = await createRefreshToken(user);

  return c.json({ accessToken, refreshToken });
});

authRoutes.post('/change-password', async (c) => {
  const payload = await parseJson(c, changePasswordSchema);
  let tokenPayload: { sub: string; type: string };
  try {
    tokenPayload = verifyMfaToken(payload.mfaToken);
  } catch {
    throw new HTTPException(401, { message: 'No autorizado' });
  }
  if (!tokenPayload || tokenPayload.type !== 'mfa') {
    throw new HTTPException(401, { message: 'No autorizado' });
  }

  const user = await findActiveUserById(tokenPayload.sub);
  if (!user) {
    throw new HTTPException(401, { message: 'No autorizado' });
  }

  if (!user.passwordTemporal) {
    throw new HTTPException(400, { message: 'La contraseña no es temporal' });
  }

  await updateUserById(user.id, {
    passwordHash: await hashPassword(payload.newPassword),
    passwordTemporal: false,
    updatedAt: new Date(),
  });

  // Si no tiene MFA configurado, debe configurarlo
  if (!user.mfaEnabled || !user.mfaSecret) {
    return c.json({
      mfaSetupRequired: true,
      mfaToken: payload.mfaToken,
    });
  }

  return c.json({
    mfaRequired: true,
    mfaToken: payload.mfaToken,
  });
});

authRoutes.post('/logout', authMiddleware, async (c) => {
  const payload = await parseJson(c, logoutSchema ?? z.object({}));
  const user = c.get('user') as User;

  if (payload?.refreshToken) {
    await revokeRefreshToken(payload.refreshToken);
  } else {
    await revokeAllRefreshTokensForUser(user.id);
  }

  return c.json({ message: 'Sesión cerrada' });
});

authRoutes.get('/me', authMiddleware, async (c) => {
  const user = c.get('user') as User;
  return c.json(toUserResponse(user));
});

authRoutes.post('/forgot-password', async (c) => {
  const payload = await parseJson(c, forgotPasswordSchema);
  const user = await findUserByEmail(payload.email);
  if (user) {
    await createResetToken(user);
  }

  return c.json({ message: 'If the email exists, we sent reset instructions.' });
});

authRoutes.post('/reset-password', async (c) => {
  const payload = await parseJson(c, resetPasswordSchema);
  const record = await findResetTokenRecord(payload.token);

  if (!record || record.usedAt) {
    throw new HTTPException(401, { message: 'No autorizado' });
  }

  if (new Date(record.expiresAt).getTime() < Date.now()) {
    throw new HTTPException(401, { message: 'No autorizado' });
  }

  const user = await findUserById(record.usuarioId);
  if (!user || user.deletedAt) {
    throw new HTTPException(401, { message: 'No autorizado' });
  }

  await updateUserById(user.id, {
    passwordHash: await hashPassword(payload.newPassword),
    updatedAt: new Date(),
  });
  await markResetTokenUsed(record.id);

  return c.json({ message: 'Contraseña actualizada' });
});
