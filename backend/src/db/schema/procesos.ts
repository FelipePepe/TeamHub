import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  date,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import {
  processStatusEnum,
  taskStatusEnum,
  taskCategoryEnum,
  priorityEnum,
} from './enums';
import { users } from './users';
import { plantillasOnboarding, tareasPlantilla } from './plantillas';

// ============================================================================
// PROCESOS_ONBOARDING - Procesos de onboarding instanciados
// ============================================================================
export const procesosOnboarding = pgTable(
  'procesos_onboarding',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Empleado que está siendo onboardeado
    empleadoId: uuid('empleado_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    // Plantilla de la que se generó este proceso
    plantillaId: uuid('plantilla_id')
      .notNull()
      .references(() => plantillasOnboarding.id, { onDelete: 'restrict' }),

    // Fechas del proceso
    fechaInicio: date('fecha_inicio').notNull(),
    fechaFinEsperada: date('fecha_fin_esperada'),
    fechaFinReal: date('fecha_fin_real'),

    // Estado del proceso
    estado: processStatusEnum('estado').notNull().default('EN_CURSO'),

    // Progreso (0-100)
    progreso: decimal('progreso', { precision: 5, scale: 2 }).notNull().default('0'),

    // Notas adicionales
    notas: text('notas'),

    // Usuario que inició el proceso
    iniciadoPor: uuid('iniciado_por').references(() => users.id, {
      onDelete: 'set null',
    }),

    // Timestamps y soft delete
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('procesos_empleado_idx').on(table.empleadoId),
    index('procesos_plantilla_idx').on(table.plantillaId),
    index('procesos_estado_idx').on(table.estado),
    index('procesos_fecha_inicio_idx').on(table.fechaInicio),
    index('procesos_iniciado_por_idx').on(table.iniciadoPor),
    index('procesos_deleted_at_idx').on(table.deletedAt),
  ]
);

// ============================================================================
// TAREAS_ONBOARDING - Tareas instanciadas de un proceso
// ============================================================================
export const tareasOnboarding = pgTable(
  'tareas_onboarding',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Proceso al que pertenece esta tarea
    procesoId: uuid('proceso_id')
      .notNull()
      .references(() => procesosOnboarding.id, { onDelete: 'cascade' }),

    // Referencia a la tarea plantilla original (opcional, para trazabilidad)
    tareaPlantillaId: uuid('tarea_plantilla_id').references(() => tareasPlantilla.id, {
      onDelete: 'set null',
    }),

    // Datos de la tarea (copiados de la plantilla al crear)
    titulo: varchar('titulo', { length: 200 }).notNull(),
    descripcion: text('descripcion'),
    categoria: taskCategoryEnum('categoria').notNull(),

    // Responsable asignado
    responsableId: uuid('responsable_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    // Fecha límite calculada
    fechaLimite: date('fecha_limite'),

    // Estado de la tarea
    estado: taskStatusEnum('estado').notNull().default('PENDIENTE'),

    // Prioridad
    prioridad: priorityEnum('prioridad').notNull().default('MEDIA'),

    // Datos de completación
    completadaAt: timestamp('completada_at', { withTimezone: true }),
    completadaPor: uuid('completada_por').references(() => users.id, {
      onDelete: 'set null',
    }),

    // Notas y evidencia
    notas: text('notas'),
    evidenciaUrl: varchar('evidencia_url', { length: 500 }),
    comentariosRechazo: text('comentarios_rechazo'),

    // Orden en el proceso
    orden: integer('orden').notNull(),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('tareas_onboarding_proceso_idx').on(table.procesoId),
    index('tareas_onboarding_responsable_idx').on(table.responsableId),
    index('tareas_onboarding_estado_idx').on(table.estado),
    index('tareas_onboarding_fecha_limite_idx').on(table.fechaLimite),
    index('tareas_onboarding_orden_idx').on(table.procesoId, table.orden),
  ]
);

// ============================================================================
// Type exports
// ============================================================================
export type ProcesoOnboarding = typeof procesosOnboarding.$inferSelect;
export type NewProcesoOnboarding = typeof procesosOnboarding.$inferInsert;
export type TareaOnboarding = typeof tareasOnboarding.$inferSelect;
export type NewTareaOnboarding = typeof tareasOnboarding.$inferInsert;
