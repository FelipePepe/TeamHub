import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { userRoleEnum } from './enums.js';

// ============================================================================
// USERS - Tabla principal de usuarios
// ============================================================================
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    nombre: varchar('nombre', { length: 100 }).notNull(),
    apellidos: varchar('apellidos', { length: 100 }),
    rol: userRoleEnum('rol').notNull().default('EMPLEADO'),

    // FK a departamentos (se añade después por referencia circular)
    departamentoId: uuid('departamento_id'),

    // Self-reference para jerarquía de managers
    managerId: uuid('manager_id'),

    avatarUrl: varchar('avatar_url', { length: 500 }),
    ultimoAcceso: timestamp('ultimo_acceso', { withTimezone: true }),

    // Password temporal (requiere cambio en primer login)
    passwordTemporal: boolean('password_temporal').notNull().default(false),

    // MFA (Multi-Factor Authentication)
    mfaEnabled: boolean('mfa_enabled').notNull().default(false),
    mfaSecret: varchar('mfa_secret', { length: 255 }), // encrypted
    mfaRecoveryCodes: text('mfa_recovery_codes').array(), // hashed codes

    // Bloqueo por intentos fallidos
    failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),

    // Timestamps y soft delete
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('users_email_idx').on(table.email),
    index('users_departamento_idx').on(table.departamentoId),
    index('users_manager_idx').on(table.managerId),
    index('users_rol_idx').on(table.rol),
    index('users_deleted_at_idx').on(table.deletedAt),
  ]
);

// ============================================================================
// REFRESH_TOKENS - Tokens de refresco JWT
// ============================================================================
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('refresh_tokens_usuario_idx').on(table.usuarioId),
    uniqueIndex('refresh_tokens_hash_idx').on(table.tokenHash),
    index('refresh_tokens_expires_idx').on(table.expiresAt),
  ]
);

// ============================================================================
// PASSWORD_RESET_TOKENS - Tokens para recuperación de contraseña
// ============================================================================
export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('password_reset_tokens_usuario_idx').on(table.usuarioId),
    uniqueIndex('password_reset_tokens_hash_idx').on(table.tokenHash),
  ]
);

// ============================================================================
// Type exports
// ============================================================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;
