import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { auditOperationEnum } from './enums.js';

// ============================================================================
// AUDIT_LOG - Registro de auditoría de todas las operaciones
// ============================================================================
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Tabla afectada
    tableName: varchar('table_name', { length: 100 }).notNull(),

    // ID del registro afectado
    recordId: uuid('record_id').notNull(),

    // Tipo de operación
    operation: auditOperationEnum('operation').notNull(),

    // Usuario que realizó la operación (puede ser null para operaciones del sistema)
    usuarioId: uuid('usuario_id'),

    // Email del usuario (para referencia histórica si el usuario se elimina)
    usuarioEmail: varchar('usuario_email', { length: 255 }),

    // Datos antes de la operación (para UPDATE y DELETE)
    oldData: jsonb('old_data'),

    // Datos después de la operación (para INSERT y UPDATE)
    newData: jsonb('new_data'),

    // Campos cambiados (solo para UPDATE)
    changedFields: text('changed_fields').array(),

    // Dirección IP del cliente (si está disponible)
    ipAddress: varchar('ip_address', { length: 45 }), // IPv6 max length

    // User agent del cliente (si está disponible)
    userAgent: text('user_agent'),

    // Timestamp de la operación
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('audit_log_table_name_idx').on(table.tableName),
    index('audit_log_record_id_idx').on(table.recordId),
    index('audit_log_operation_idx').on(table.operation),
    index('audit_log_usuario_id_idx').on(table.usuarioId),
    index('audit_log_created_at_idx').on(table.createdAt),
    // Índice compuesto para búsquedas comunes
    index('audit_log_table_record_idx').on(table.tableName, table.recordId),
    index('audit_log_usuario_created_idx').on(table.usuarioId, table.createdAt),
  ]
);

// ============================================================================
// Type exports
// ============================================================================
export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
