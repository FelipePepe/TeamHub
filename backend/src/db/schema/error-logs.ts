import { boolean, index, inet, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users.js';

/**
 * Enum para el origen del error
 */
export const errorOriginEnum = ['FRONTEND', 'BACKEND'] as const;
export type ErrorOrigin = (typeof errorOriginEnum)[number];

/**
 * Enum para el nivel de severidad del error
 */
export const errorLevelEnum = ['INFO', 'WARN', 'ERROR', 'FATAL'] as const;
export type ErrorLevel = (typeof errorLevelEnum)[number];

/**
 * Tabla para registrar todos los errores de la aplicación
 * Permite diagnóstico rápido sin depender del usuario
 */
export const errorLogs = pgTable(
  'error_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Usuario que experimentó el error (puede ser null si no está autenticado)
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),

    // Origen del error
    origen: varchar('origen', { length: 10 }).notNull().$type<ErrorOrigin>(),

    // Nivel de severidad
    nivel: varchar('nivel', { length: 10 }).notNull().$type<ErrorLevel>(),

    // Mensaje de error legible
    mensaje: text('mensaje').notNull(),

    // Stack trace completo (solo para debugging, nunca se muestra al usuario)
    stackTrace: text('stack_trace'),

    // Contexto completo del error (JSON)
    // Frontend: { url, userAgent, viewport, route, component, props }
    // Backend: { endpoint, method, params, query, headers, requestId }
    contexto: jsonb('contexto').$type<Record<string, unknown>>(),

    // User agent del navegador
    userAgent: text('user_agent'),

    // IP del cliente
    ipAddress: inet('ip_address'),

    // Timestamp del error
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),

    // Flag para marcar como resuelto
    resuelto: boolean('resuelto').notNull().default(false),

    // Notas del desarrollador sobre la solución
    notas: text('notas'),

    // ID de Sentry para correlación (si se usa Sentry)
    sentryEventId: varchar('sentry_event_id', { length: 100 }),
  },
  (table) => [
    index('error_logs_user_idx').on(table.userId),
    index('error_logs_origen_idx').on(table.origen),
    index('error_logs_nivel_idx').on(table.nivel),
    index('error_logs_timestamp_idx').on(table.timestamp),
    index('error_logs_resuelto_idx').on(table.resuelto),
  ]
);

export type ErrorLog = typeof errorLogs.$inferSelect;
export type NewErrorLog = typeof errorLogs.$inferInsert;
