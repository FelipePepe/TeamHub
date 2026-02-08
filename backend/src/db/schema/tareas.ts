import { pgTable, uuid, text, timestamp, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';
import { proyectos } from './proyectos.js';
import { users } from './users.js';

// Estado de tarea
export const estadoTareaEnum = pgEnum('estado_tarea', [
  'TODO',
  'IN_PROGRESS',
  'REVIEW',
  'DONE',
  'BLOCKED',
]);

// Prioridad de tarea
export const prioridadTareaEnum = pgEnum('prioridad_tarea', [
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
]);

export const tareas = pgTable(
  'tareas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    proyectoId: uuid('proyecto_id')
      .notNull()
      .references(() => proyectos.id, { onDelete: 'cascade' }),
    titulo: text('titulo').notNull(),
    descripcion: text('descripcion'),
    estado: estadoTareaEnum('estado').notNull().default('TODO'),
    prioridad: prioridadTareaEnum('prioridad').notNull().default('MEDIUM'),
    usuarioAsignadoId: uuid('usuario_asignado_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    fechaInicio: timestamp('fecha_inicio', { withTimezone: true }),
    fechaFin: timestamp('fecha_fin', { withTimezone: true }),
    horasEstimadas: text('horas_estimadas'), // Numeric as text for precision
    horasReales: text('horas_reales'), // Numeric as text for precision
    orden: text('orden').notNull().default('0'), // Integer as text for large numbers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dependeDe: uuid('depende_de').references((): any => tareas.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [uniqueIndex('tareas_proyecto_orden_unique').on(table.proyectoId, table.orden)]
);

export type Tarea = typeof tareas.$inferSelect;
export type NuevaTarea = typeof tareas.$inferInsert;
export type EstadoTarea = (typeof estadoTareaEnum.enumValues)[number];
export type PrioridadTarea = (typeof prioridadTareaEnum.enumValues)[number];
