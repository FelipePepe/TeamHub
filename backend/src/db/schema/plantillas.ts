import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { userRoleEnum, taskCategoryEnum, responsibleTypeEnum } from './enums.js';
import { users } from './users.js';
import { departamentos } from './departamentos.js';

// ============================================================================
// PLANTILLAS_ONBOARDING - Plantillas reutilizables de onboarding
// ============================================================================
export const plantillasOnboarding = pgTable(
  'plantillas_onboarding',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    nombre: varchar('nombre', { length: 150 }).notNull(),
    descripcion: text('descripcion'),

    // Opcional: departamento específico para esta plantilla
    departamentoId: uuid('departamento_id').references(() => departamentos.id, {
      onDelete: 'set null',
    }),

    // Opcional: rol destino de esta plantilla
    rolDestino: userRoleEnum('rol_destino'),

    // Duración estimada en días
    duracionEstimadaDias: integer('duracion_estimada_dias'),

    // Creador de la plantilla
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    // Timestamps y soft delete
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('plantillas_nombre_departamento_rol_unique')
      .on(table.nombre, table.departamentoId, table.rolDestino)
      .where(sql`${table.deletedAt} IS NULL`),
    index('plantillas_departamento_idx').on(table.departamentoId),
    index('plantillas_rol_destino_idx').on(table.rolDestino),
    index('plantillas_created_by_idx').on(table.createdBy),
    index('plantillas_deleted_at_idx').on(table.deletedAt),
  ]
);

// ============================================================================
// TAREAS_PLANTILLA - Tareas definidas en plantillas
// ============================================================================
export const tareasPlantilla = pgTable(
  'tareas_plantilla',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Referencia a la plantilla padre
    plantillaId: uuid('plantilla_id')
      .notNull()
      .references(() => plantillasOnboarding.id, { onDelete: 'cascade' }),

    titulo: varchar('titulo', { length: 200 }).notNull(),
    descripcion: text('descripcion'),

    // Categoría de la tarea
    categoria: taskCategoryEnum('categoria').notNull(),

    // Tipo de responsable
    responsableTipo: responsibleTypeEnum('responsable_tipo').notNull(),

    // Usuario específico (solo si responsableTipo = 'CUSTOM')
    responsableId: uuid('responsable_id').references(() => users.id, {
      onDelete: 'set null',
    }),

    // Días desde inicio del proceso para fecha límite
    diasDesdeInicio: integer('dias_desde_inicio').notNull().default(0),

    // Duración estimada en horas
    duracionEstimadaHoras: decimal('duracion_estimada_horas', {
      precision: 5,
      scale: 2,
    }),

    // Orden de la tarea en la plantilla
    orden: integer('orden').notNull(),

    // Flags
    obligatoria: boolean('obligatoria').notNull().default(true),
    requiereEvidencia: boolean('requiere_evidencia').notNull().default(false),

    // Contenido adicional
    instrucciones: text('instrucciones'),
    recursosUrl: text('recursos_url').array(), // Array de URLs

    // Dependencias: IDs de otras tareas que deben completarse antes
    dependencias: uuid('dependencias').array(),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('tareas_plantilla_plantilla_idx').on(table.plantillaId),
    index('tareas_plantilla_categoria_idx').on(table.categoria),
    uniqueIndex('tareas_plantilla_orden_idx').on(table.plantillaId, table.orden),
  ]
);

// ============================================================================
// Type exports
// ============================================================================
export type PlantillaOnboarding = typeof plantillasOnboarding.$inferSelect;
export type NewPlantillaOnboarding = typeof plantillasOnboarding.$inferInsert;
export type TareaPlantilla = typeof tareasPlantilla.$inferSelect;
export type NewTareaPlantilla = typeof tareasPlantilla.$inferInsert;
