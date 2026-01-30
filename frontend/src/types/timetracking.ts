import type { ProyectoEstado } from '@/hooks/use-proyectos';

// Timesheet Semanal
export interface TimesheetEntry {
  proyectoId: string;
  proyectoNombre: string;
  proyectoCodigo: string;
  horasPorDia: Record<string, number>; // fecha ISO -> horas
  totalSemana: number;
}

export interface TimesheetData {
  semanaInicio: Date;
  semanaFin: Date;
  dias: Date[];
  entradas: TimesheetEntry[];
  totalPorDia: Record<string, number>;
  totalSemana: number;
}

export interface TimesheetCellData {
  proyectoId: string;
  fecha: string;
  horas: number;
  entryId?: string;
}

// Gantt Chart
export interface GanttProyecto {
  id: string;
  nombre: string;
  codigo: string;
  fechaInicio: Date;
  fechaFin: Date;
  estado: ProyectoEstado;
  progreso: number;
  color?: string;
  asignaciones: GanttAsignacion[];
}

export interface GanttAsignacion {
  id: string;
  usuarioId: string;
  usuarioNombre: string;
  fechaInicio: Date;
  fechaFin: Date;
  rol?: string;
}

export type GanttZoomLevel = 'month' | 'quarter' | 'year';

export interface GanttConfig {
  startDate: Date;
  endDate: Date;
  zoom: GanttZoomLevel;
  rowHeight: number;
  headerHeight: number;
  barHeight: number;
  padding: number;
}

// Colores por estado de proyecto
export const ESTADO_COLORS: Record<ProyectoEstado, string> = {
  PLANIFICACION: '#94a3b8',
  ACTIVO: '#3b82f6',
  PAUSADO: '#f59e0b',
  COMPLETADO: '#22c55e',
  CANCELADO: '#ef4444',
};

export const ESTADO_LABELS: Record<ProyectoEstado, string> = {
  PLANIFICACION: 'Planificación',
  ACTIVO: 'Activo',
  PAUSADO: 'Pausado',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
};
