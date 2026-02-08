import type { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import type { HonoEnv } from '../../types/hono.js';
import { authMiddleware } from '../../middleware/auth.js';
import { createRateLimiter, getRateLimitIp } from '../../middleware/rate-limit.js';
import { parseJson } from '../../validators/parse.js';
import { loginSchema } from '../../validators/auth.js';
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
  verifyMfaToken,
  verifyPassword,
  verifyRefreshToken,
} from '../../services/auth-service.js';
import {
  decryptMfaSecret,
  encryptMfaSecret,
  generateMfaSecret,
  verifyTotpCode,
} from '../../services/mfa-service.js';
import { toUserResponse } from '../../services/mappers.js';
import { config } from '../../config/env.js';
import type { User } from '../../db/schema/users.js';
import {
  countUsers,
  findActiveUserById,
  findUserByEmail,
  findUserById,
  updateUserById,
} from '../../services/users-repository.js';
import {
  authenticateForMfaSetup,
  bootstrapUser,
  isAccountLocked,
  registerFailedLogin,
  resetLoginFailures,
  validateBootstrapToken,
} from './helpers.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  logoutSchema,
  mfaVerifySchema,
  refreshSchema,
  resetPasswordSchema,
} from './schemas.js';

export const registerAuthRoutes = (router: Hono<HonoEnv>) => {
  const loginRateLimit = createRateLimiter({
    windowMs: config.LOGIN_RATE_LIMIT_WINDOW_MS,
    max: config.LOGIN_RATE_LIMIT_MAX,
    keyGenerator: (c) => `ip:${getRateLimitIp(c)}`,
    message: 'Too many login attempts',
  });

  router.use('/login', loginRateLimit);

  router.post('/login', async (c) => {
    const payload = await parseJson(c, loginSchema);

    let user = await findUserByEmail(payload.email);
    if (!user) {
      const totalUsers = await countUsers();
      if (totalUsers === 0) {
        // Bootstrap requires BOOTSTRAP_TOKEN header for security
        const bootstrapToken = c.req.header('X-Bootstrap-Token');
        validateBootstrapToken(bootstrapToken);
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

  router.post('/mfa/verify', async (c) => {
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

  router.post('/mfa/setup', async (c) => {
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

  router.post('/refresh', async (c) => {
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

  router.post('/change-password', async (c) => {
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

  router.post('/logout', authMiddleware, async (c) => {
    const payload = await parseJson(c, logoutSchema ?? z.object({}));
    const user = c.get('user') as User;

    if (payload?.refreshToken) {
      await revokeRefreshToken(payload.refreshToken);
    } else {
      await revokeAllRefreshTokensForUser(user.id);
    }

    return c.json({ message: 'Sesión cerrada' });
  });

  router.get('/me', authMiddleware, async (c) => {
    const user = c.get('user') as User;
    return c.json(toUserResponse(user));
  });

  router.post('/forgot-password', async (c) => {
    const payload = await parseJson(c, forgotPasswordSchema);
    const user = await findUserByEmail(payload.email);
    if (user) {
      await createResetToken(user);
    }

    return c.json({ message: 'If the email exists, we sent reset instructions.' });
  });

  router.post('/reset-password', async (c) => {
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
};
