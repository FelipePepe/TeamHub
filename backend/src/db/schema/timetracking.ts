import {
  pgTable,
  uuid,
  text,
  decimal,
  boolean,
  date,
  timestamp,
  index,
  check,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { timeEntryStatusEnum } from './enums.js';
import { users } from './users.js';
import { proyectos, asignaciones } from './proyectos.js';

// ============================================================================
// TIMETRACKING - Registros de tiempo/horas
// ============================================================================
export const timetracking = pgTable(
  'timetracking',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Usuario que registra las horas
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    // Proyecto al que se imputan las horas
    proyectoId: uuid('proyecto_id')
      .notNull()
      .references(() => proyectos.id, { onDelete: 'restrict' }),

    // Asignación específica (opcional, para tracking más preciso)
    asignacionId: uuid('asignacion_id').references(() => asignaciones.id, {
      onDelete: 'set null',
    }),

    // Fecha del registro
    fecha: date('fecha').notNull(),

    // Horas registradas (0 < horas <= 24)
    horas: decimal('horas', { precision: 4, scale: 2 }).notNull(),

    // Descripción del trabajo realizado
    descripcion: text('descripcion').notNull(),

    // ¿Es facturable?
    facturable: boolean('facturable').notNull().default(true),

    // Estado del registro
    estado: timeEntryStatusEnum('estado').notNull().default('PENDIENTE'),

    // Aprobación
    aprobadoPor: uuid('aprobado_por').references(() => users.id, {
      onDelete: 'set null',
    }),
    aprobadoAt: timestamp('aprobado_at', { withTimezone: true }),

    // Rechazo
    rechazadoPor: uuid('rechazado_por').references(() => users.id, {
      onDelete: 'set null',
    }),
    rechazadoAt: timestamp('rechazado_at', { withTimezone: true }),
    comentarioRechazo: text('comentario_rechazo'),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('timetracking_entry_unique').on(
      table.usuarioId,
      table.proyectoId,
      table.fecha,
      table.descripcion,
      table.horas,
      table.estado,
      table.facturable
    ),
    // Constraints
    check('timetracking_horas_check', sql`${table.horas} > 0 AND ${table.horas} <= 24`),

    // Índices
    index('timetracking_usuario_idx').on(table.usuarioId),
    index('timetracking_proyecto_idx').on(table.proyectoId),
    index('timetracking_asignacion_idx').on(table.asignacionId),
    index('timetracking_fecha_idx').on(table.fecha),
    index('timetracking_estado_idx').on(table.estado),
    index('timetracking_usuario_fecha_idx').on(table.usuarioId, table.fecha),
    index('timetracking_proyecto_fecha_idx').on(table.proyectoId, table.fecha),
  ]
);

// ============================================================================
// Type exports
// ============================================================================
export type Timetracking = typeof timetracking.$inferSelect;
export type NewTimetracking = typeof timetracking.$inferInsert;
