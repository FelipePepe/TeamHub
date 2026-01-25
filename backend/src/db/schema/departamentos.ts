import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users';

// ============================================================================
// DEPARTAMENTOS - Departamentos de la empresa
// ============================================================================
export const departamentos = pgTable(
  'departamentos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    nombre: varchar('nombre', { length: 100 }).notNull().unique(),
    codigo: varchar('codigo', { length: 20 }).notNull().unique(),
    descripcion: text('descripcion'),

    // Responsable del departamento (MANAGER o superior)
    responsableId: uuid('responsable_id').references(() => users.id, {
      onDelete: 'set null',
    }),

    // Color para UI (formato #RRGGBB)
    color: varchar('color', { length: 7 }),

    // Timestamps y soft delete
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('departamentos_nombre_idx').on(table.nombre),
    uniqueIndex('departamentos_codigo_idx').on(table.codigo),
    index('departamentos_responsable_idx').on(table.responsableId),
    index('departamentos_deleted_at_idx').on(table.deletedAt),
  ]
);

// ============================================================================
// Type exports
// ============================================================================
export type Departamento = typeof departamentos.$inferSelect;
export type NewDepartamento = typeof departamentos.$inferInsert;
