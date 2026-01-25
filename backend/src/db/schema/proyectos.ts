import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  date,
  timestamp,
  index,
  uniqueIndex,
  unique,
} from 'drizzle-orm/pg-core';
import { projectStatusEnum, priorityEnum } from './enums.js';
import { users } from './users.js';

// ============================================================================
// PROYECTOS - Proyectos de la empresa
// ============================================================================
export const proyectos = pgTable(
  'proyectos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    nombre: varchar('nombre', { length: 150 }).notNull(),
    codigo: varchar('codigo', { length: 20 }).notNull().unique(),
    descripcion: text('descripcion'),

    // Cliente del proyecto
    cliente: varchar('cliente', { length: 150 }),

    // Fechas del proyecto
    fechaInicio: date('fecha_inicio'),
    fechaFinEstimada: date('fecha_fin_estimada'),
    fechaFinReal: date('fecha_fin_real'),

    // Estado del proyecto
    estado: projectStatusEnum('estado').notNull().default('PLANIFICACION'),

    // Manager responsable del proyecto
    managerId: uuid('manager_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    // Presupuesto de horas y consumidas (actualizado por trigger)
    presupuestoHoras: decimal('presupuesto_horas', { precision: 10, scale: 2 }),
    horasConsumidas: decimal('horas_consumidas', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),

    // Prioridad
    prioridad: priorityEnum('prioridad').notNull().default('MEDIA'),

    // Color para UI (formato #RRGGBB)
    color: varchar('color', { length: 7 }),

    // Timestamps y soft delete
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('proyectos_codigo_idx').on(table.codigo),
    index('proyectos_manager_idx').on(table.managerId),
    index('proyectos_estado_idx').on(table.estado),
    index('proyectos_cliente_idx').on(table.cliente),
    index('proyectos_deleted_at_idx').on(table.deletedAt),
  ]
);

// ============================================================================
// ASIGNACIONES - Asignaciones de usuarios a proyectos
// ============================================================================
export const asignaciones = pgTable(
  'asignaciones',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Proyecto al que se asigna
    proyectoId: uuid('proyecto_id')
      .notNull()
      .references(() => proyectos.id, { onDelete: 'cascade' }),

    // Usuario asignado
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Rol del usuario en este proyecto
    rol: varchar('rol', { length: 100 }),

    // Dedicación: porcentaje (0-100) o horas semanales (excluyentes)
    dedicacionPorcentaje: decimal('dedicacion_porcentaje', {
      precision: 5,
      scale: 2,
    }),
    horasSemanales: decimal('horas_semanales', { precision: 5, scale: 2 }),

    // Período de asignación
    fechaInicio: date('fecha_inicio').notNull(),
    fechaFin: date('fecha_fin'),

    // Notas adicionales
    notas: text('notas'),

    // Timestamps y soft delete
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    // Un usuario no puede tener dos asignaciones activas al mismo proyecto con la misma fecha inicio
    unique('asignaciones_proyecto_usuario_fecha_unique').on(
      table.proyectoId,
      table.usuarioId,
      table.fechaInicio
    ),
    index('asignaciones_proyecto_idx').on(table.proyectoId),
    index('asignaciones_usuario_idx').on(table.usuarioId),
    index('asignaciones_fecha_inicio_idx').on(table.fechaInicio),
    index('asignaciones_deleted_at_idx').on(table.deletedAt),
  ]
);

// ============================================================================
// Type exports
// ============================================================================
export type Proyecto = typeof proyectos.$inferSelect;
export type NewProyecto = typeof proyectos.$inferInsert;
export type Asignacion = typeof asignaciones.$inferSelect;
export type NewAsignacion = typeof asignaciones.$inferInsert;
