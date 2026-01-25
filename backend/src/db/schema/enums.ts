import { pgEnum } from 'drizzle-orm/pg-core';

// Rol de usuario en el sistema
export const userRoleEnum = pgEnum('user_role', [
  'ADMIN',
  'RRHH',
  'MANAGER',
  'EMPLEADO',
]);

// Categoría de tareas de onboarding
export const taskCategoryEnum = pgEnum('task_category', [
  'DOCUMENTACION',
  'EQUIPAMIENTO',
  'ACCESOS',
  'FORMACION',
  'REUNIONES',
  'ADMINISTRATIVO',
]);

// Tipo de responsable en plantilla de tarea
export const responsibleTypeEnum = pgEnum('responsible_type', [
  'RRHH',
  'MANAGER',
  'IT',
  'EMPLEADO',
  'CUSTOM',
]);

// Estado del proceso de onboarding
export const processStatusEnum = pgEnum('process_status', [
  'EN_CURSO',
  'COMPLETADO',
  'CANCELADO',
  'PAUSADO',
]);

// Estado de tarea de onboarding
export const taskStatusEnum = pgEnum('task_status', [
  'PENDIENTE',
  'EN_PROGRESO',
  'COMPLETADA',
  'BLOQUEADA',
  'CANCELADA',
]);

// Prioridad (tareas, proyectos)
export const priorityEnum = pgEnum('priority', [
  'BAJA',
  'MEDIA',
  'ALTA',
  'URGENTE',
]);

// Estado del proyecto
export const projectStatusEnum = pgEnum('project_status', [
  'PLANIFICACION',
  'ACTIVO',
  'PAUSADO',
  'COMPLETADO',
  'CANCELADO',
]);

// Estado del registro de tiempo
export const timeEntryStatusEnum = pgEnum('time_entry_status', [
  'PENDIENTE',
  'APROBADO',
  'RECHAZADO',
]);

// Operación de auditoría
export const auditOperationEnum = pgEnum('audit_operation', [
  'INSERT',
  'UPDATE',
  'DELETE',
]);
