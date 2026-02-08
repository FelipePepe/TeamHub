export const MAX_ACTIVITY_ITEMS = 6;
export const MAX_ALERT_ITEMS = 6;
export const MAX_TEAM_ITEMS = 8;
export const DAYS_WEEK = 7;
export const CRITICAL_OVERDUE_DAYS = 7;
export const MONTH_POINTS = 6;

/** Etiquetas legibles para roles de usuario en gráficas de dashboard. */
export const ROL_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  RRHH: 'Recursos Humanos',
  MANAGER: 'Manager',
  EMPLEADO: 'Empleado',
};

/** Etiquetas legibles para estados de proyecto en gráficas de dashboard. */
export const PROYECTO_ESTADO_LABELS: Record<string, string> = {
  PLANIFICACION: 'Planificación',
  ACTIVO: 'Activo',
  PAUSADO: 'Pausado',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
};

/** Etiquetas legibles para estados de timetracking en gráficas de dashboard. */
export const TIMETRACKING_ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
};
