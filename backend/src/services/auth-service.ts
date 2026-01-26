import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { and, eq, isNull } from 'drizzle-orm';
import type { StringValue } from 'ms';
import { config } from '../config/env.js';
import { BUSINESS_RULES } from '../shared/constants/business-rules.js';
import { createId } from '../store/index.js';
import { db } from '../db/index.js';
import { passwordResetTokens, refreshTokens } from '../db/schema/users.js';

type AuthUser = {
  id: string;
  rol: string;
};

const durationToMs = (value: string): number => {
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 0;
  }
  const amount = Number(match[1]);
  const unit = match[2];
  switch (unit) {
    case 's':
      return amount * 1000;
    case 'm':
      return amount * 60 * 1000;
    case 'h':
      return amount * 60 * 60 * 1000;
    case 'd':
      return amount * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
};

export const hashPassword = async (password: string) => {
  const saltRounds = config.BCRYPT_SALT_ROUNDS;
  return bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

const nowDate = () => new Date();

const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

const toDate = (value: Date | string) =>
  value instanceof Date ? value : new Date(value);

export const createAccessToken = (user: AuthUser): string => {
  const payload = { sub: user.id, role: user.rol };
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN as StringValue,
  });
};

export const createRefreshToken = async (user: AuthUser): Promise<string> => {
  const payload = { sub: user.id, type: 'refresh', jti: createId() };
  const token = jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN as StringValue,
  });

  const expiresInMs = durationToMs(config.JWT_REFRESH_EXPIRES_IN);
  const expiresAt = expiresInMs ? new Date(Date.now() + expiresInMs) : nowDate();

  await db.insert(refreshTokens).values({
    usuarioId: user.id,
    tokenHash: hashToken(token),
    expiresAt,
  });

  return token;
};

export const revokeRefreshToken = async (token: string) => {
  await db
    .update(refreshTokens)
    .set({ revokedAt: nowDate() })
    .where(and(eq(refreshTokens.tokenHash, hashToken(token)), isNull(refreshTokens.revokedAt)));
};

export const revokeAllRefreshTokensForUser = async (userId: string) => {
  await db
    .update(refreshTokens)
    .set({ revokedAt: nowDate() })
    .where(and(eq(refreshTokens.usuarioId, userId), isNull(refreshTokens.revokedAt)));
};

export const verifyAccessToken = (token: string) => {
  const payload = jwt.verify(token, config.JWT_ACCESS_SECRET) as {
    sub: string;
    role: string;
    type?: string;
  };
  if (payload.type) {
    throw new Error('Invalid access token');
  }
  return payload;
};

export const verifyRefreshToken = async (token: string) => {
  const payload = jwt.verify(token, config.JWT_REFRESH_SECRET) as { sub: string; type?: string };
  if (payload.type !== 'refresh') {
    throw new Error('Invalid refresh token');
  }
  const tokenHash = hashToken(token);
  const record = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash))
    .limit(1);
  const found = record[0];
  if (!found || found.revokedAt) {
    throw new Error('Refresh token revoked');
  }
  if (toDate(found.expiresAt).getTime() < Date.now()) {
    throw new Error('Refresh token expired');
  }
  return payload;
};

export const createMfaToken = (user: AuthUser): string => {
  const payload = { sub: user.id, type: 'mfa' };
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: BUSINESS_RULES.auth.mfaTokenTtl as StringValue,
  });
};

export const verifyMfaToken = (token: string) => {
  return jwt.verify(token, config.JWT_ACCESS_SECRET) as { sub: string; type: string };
};

export const createResetToken = async (user: AuthUser) => {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await db.insert(passwordResetTokens).values({
    usuarioId: user.id,
    tokenHash: hashToken(token),
    expiresAt,
  });
  return token;
};

export const findResetTokenRecord = async (token: string) => {
  const record = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, hashToken(token)))
    .limit(1);
  return record[0] ?? null;
};

export const markResetTokenUsed = async (id: string) => {
  await db
    .update(passwordResetTokens)
    .set({ usedAt: nowDate() })
    .where(eq(passwordResetTokens.id, id));
};
