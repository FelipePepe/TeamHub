import { relations } from 'drizzle-orm';
import { users, refreshTokens, passwordResetTokens } from './users';
import { departamentos } from './departamentos';
import { plantillasOnboarding, tareasPlantilla } from './plantillas';
import { procesosOnboarding, tareasOnboarding } from './procesos';
import { proyectos, asignaciones } from './proyectos';
import { timetracking } from './timetracking.js';

// ============================================================================
// USERS RELATIONS
// ============================================================================
export const usersRelations = relations(users, ({ one, many }) => ({
  // Pertenece a un departamento
  departamento: one(departamentos, {
    fields: [users.departamentoId],
    references: [departamentos.id],
  }),

  // Tiene un manager (self-reference)
  manager: one(users, {
    fields: [users.managerId],
    references: [users.id],
    relationName: 'manager_subordinates',
  }),

  // Es manager de otros usuarios
  subordinates: many(users, {
    relationName: 'manager_subordinates',
  }),

  // Tokens de refresco
  refreshTokens: many(refreshTokens),

  // Tokens de reset de password
  passwordResetTokens: many(passwordResetTokens),

  // Procesos de onboarding donde es el empleado
  procesosComoEmpleado: many(procesosOnboarding, {
    relationName: 'empleado_procesos',
  }),

  // Procesos de onboarding que ha iniciado
  procesosIniciados: many(procesosOnboarding, {
    relationName: 'iniciador_procesos',
  }),

  // Tareas de onboarding asignadas
  tareasOnboardingAsignadas: many(tareasOnboarding, {
    relationName: 'responsable_tareas',
  }),

  // Tareas de onboarding completadas
  tareasOnboardingCompletadas: many(tareasOnboarding, {
    relationName: 'completador_tareas',
  }),

  // Proyectos donde es manager
  proyectosComoManager: many(proyectos),

  // Asignaciones a proyectos
  asignaciones: many(asignaciones),

  // Registros de tiempo
  registrosTiempo: many(timetracking, {
    relationName: 'usuario_registros',
  }),

  // Registros de tiempo aprobados
  registrosAprobados: many(timetracking, {
    relationName: 'aprobador_registros',
  }),

  // Registros de tiempo rechazados
  registrosRechazados: many(timetracking, {
    relationName: 'rechazador_registros',
  }),

  // Plantillas creadas
  plantillasCreadas: many(plantillasOnboarding),
}));

// ============================================================================
// REFRESH TOKENS RELATIONS
// ============================================================================
export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  usuario: one(users, {
    fields: [refreshTokens.usuarioId],
    references: [users.id],
  }),
}));

// ============================================================================
// PASSWORD RESET TOKENS RELATIONS
// ============================================================================
export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  usuario: one(users, {
    fields: [passwordResetTokens.usuarioId],
    references: [users.id],
  }),
}));

// ============================================================================
// DEPARTAMENTOS RELATIONS
// ============================================================================
export const departamentosRelations = relations(departamentos, ({ one, many }) => ({
  // Responsable del departamento
  responsable: one(users, {
    fields: [departamentos.responsableId],
    references: [users.id],
  }),

  // Usuarios del departamento
  usuarios: many(users),

  // Plantillas del departamento
  plantillas: many(plantillasOnboarding),
}));

// ============================================================================
// PLANTILLAS ONBOARDING RELATIONS
// ============================================================================
export const plantillasOnboardingRelations = relations(
  plantillasOnboarding,
  ({ one, many }) => ({
    // Departamento de la plantilla
    departamento: one(departamentos, {
      fields: [plantillasOnboarding.departamentoId],
      references: [departamentos.id],
    }),

    // Creador de la plantilla
    creador: one(users, {
      fields: [plantillasOnboarding.createdBy],
      references: [users.id],
    }),

    // Tareas de la plantilla
    tareas: many(tareasPlantilla),

    // Procesos generados desde esta plantilla
    procesos: many(procesosOnboarding),
  })
);

// ============================================================================
// TAREAS PLANTILLA RELATIONS
// ============================================================================
export const tareasPlantillaRelations = relations(tareasPlantilla, ({ one, many }) => ({
  // Plantilla padre
  plantilla: one(plantillasOnboarding, {
    fields: [tareasPlantilla.plantillaId],
    references: [plantillasOnboarding.id],
  }),

  // Responsable específico (si es CUSTOM)
  responsable: one(users, {
    fields: [tareasPlantilla.responsableId],
    references: [users.id],
  }),

  // Tareas de onboarding generadas desde esta plantilla
  tareasInstanciadas: many(tareasOnboarding),
}));

// ============================================================================
// PROCESOS ONBOARDING RELATIONS
// ============================================================================
export const procesosOnboardingRelations = relations(
  procesosOnboarding,
  ({ one, many }) => ({
    // Empleado del proceso
    empleado: one(users, {
      fields: [procesosOnboarding.empleadoId],
      references: [users.id],
      relationName: 'empleado_procesos',
    }),

    // Plantilla usada
    plantilla: one(plantillasOnboarding, {
      fields: [procesosOnboarding.plantillaId],
      references: [plantillasOnboarding.id],
    }),

    // Usuario que inició el proceso
    iniciador: one(users, {
      fields: [procesosOnboarding.iniciadoPor],
      references: [users.id],
      relationName: 'iniciador_procesos',
    }),

    // Tareas del proceso
    tareas: many(tareasOnboarding),
  })
);

// ============================================================================
// TAREAS ONBOARDING RELATIONS
// ============================================================================
export const tareasOnboardingRelations = relations(tareasOnboarding, ({ one }) => ({
  // Proceso padre
  proceso: one(procesosOnboarding, {
    fields: [tareasOnboarding.procesoId],
    references: [procesosOnboarding.id],
  }),

  // Tarea plantilla original
  tareaPlantilla: one(tareasPlantilla, {
    fields: [tareasOnboarding.tareaPlantillaId],
    references: [tareasPlantilla.id],
  }),

  // Responsable de la tarea
  responsable: one(users, {
    fields: [tareasOnboarding.responsableId],
    references: [users.id],
    relationName: 'responsable_tareas',
  }),

  // Usuario que completó la tarea
  completador: one(users, {
    fields: [tareasOnboarding.completadaPor],
    references: [users.id],
    relationName: 'completador_tareas',
  }),
}));

// ============================================================================
// PROYECTOS RELATIONS
// ============================================================================
export const proyectosRelations = relations(proyectos, ({ one, many }) => ({
  // Manager del proyecto
  manager: one(users, {
    fields: [proyectos.managerId],
    references: [users.id],
  }),

  // Asignaciones al proyecto
  asignaciones: many(asignaciones),

  // Registros de tiempo del proyecto
  registrosTiempo: many(timetracking),
}));

// ============================================================================
// ASIGNACIONES RELATIONS
// ============================================================================
export const asignacionesRelations = relations(asignaciones, ({ one, many }) => ({
  // Proyecto
  proyecto: one(proyectos, {
    fields: [asignaciones.proyectoId],
    references: [proyectos.id],
  }),

  // Usuario asignado
  usuario: one(users, {
    fields: [asignaciones.usuarioId],
    references: [users.id],
  }),

  // Registros de tiempo de esta asignación
  registrosTiempo: many(timetracking),
}));

// ============================================================================
// TIMETRACKING RELATIONS
// ============================================================================
export const timetrackingRelations = relations(timetracking, ({ one }) => ({
  // Usuario que registró
  usuario: one(users, {
    fields: [timetracking.usuarioId],
    references: [users.id],
    relationName: 'usuario_registros',
  }),

  // Proyecto
  proyecto: one(proyectos, {
    fields: [timetracking.proyectoId],
    references: [proyectos.id],
  }),

  // Asignación (opcional)
  asignacion: one(asignaciones, {
    fields: [timetracking.asignacionId],
    references: [asignaciones.id],
  }),

  // Aprobador
  aprobador: one(users, {
    fields: [timetracking.aprobadoPor],
    references: [users.id],
    relationName: 'aprobador_registros',
  }),

  // Rechazador
  rechazador: one(users, {
    fields: [timetracking.rechazadoPor],
    references: [users.id],
    relationName: 'rechazador_registros',
  }),
}));
