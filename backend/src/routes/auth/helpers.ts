import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { User } from '../../db/schema/users.js';
import { config } from '../../config/env.js';
import { BUSINESS_RULES } from '../../shared/constants/business-rules.js';
import { TIME_CONSTANTS } from '../../shared/constants/time.js';
import {
  createUser,
  findActiveUserById,
  findUserByEmail,
  updateUserById,
} from '../../services/users-repository.js';
import {
  hashPassword,
  verifyAccessToken,
  verifyMfaToken,
} from '../../services/auth-service.js';

export const isUniqueViolation = (error: unknown) => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  );
};

export const bootstrapUser = async (email: string, password: string): Promise<User> => {
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

export const isAccountLocked = (user: User) => {
  if (!user.lockedUntil) return false;
  return new Date(user.lockedUntil).getTime() > Date.now();
};

export const registerFailedLogin = async (user: User) => {
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

export const resetLoginFailures = async (user: User) => {
  if (user.failedLoginAttempts === 0 && !user.lockedUntil) return;
  await updateUserById(user.id, {
    failedLoginAttempts: 0,
    lockedUntil: null,
    updatedAt: new Date(),
  });
};

export const authenticateForMfaSetup = async (c: Context) => {
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

export const validateBootstrapToken = (providedToken?: string | null) => {
  if (!config.BOOTSTRAP_TOKEN || providedToken !== config.BOOTSTRAP_TOKEN) {
    throw new HTTPException(403, { message: 'Bootstrap no autorizado' });
  }
};
