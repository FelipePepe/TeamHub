import * as d3 from 'd3';
import type { GanttConfig, GanttZoomLevel } from '@/types/timetracking';
import {
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  eachWeekOfInterval,
  format,
  differenceInDays,
  addMonths,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';

export function getDateRange(zoom: GanttZoomLevel): { start: Date; end: Date } {
  const now = new Date();

  switch (zoom) {
    case 'month':
      return {
        start: subMonths(startOfMonth(now), 1),
        end: addMonths(endOfMonth(now), 1),
      };
    case 'quarter':
      return {
        start: subMonths(startOfQuarter(now), 1),
        end: addMonths(endOfQuarter(now), 2),
      };
    case 'year':
      return {
        start: startOfYear(now),
        end: endOfYear(now),
      };
  }
}

export function createTimeScale(
  startDate: Date,
  endDate: Date,
  width: number
): d3.ScaleTime<number, number> {
  return d3.scaleTime().domain([startDate, endDate]).range([0, width]);
}

export function getHeaderIntervals(
  startDate: Date,
  endDate: Date,
  zoom: GanttZoomLevel
): { date: Date; label: string; width?: number }[] {
  switch (zoom) {
    case 'month':
      return eachWeekOfInterval(
        { start: startDate, end: endDate },
        { weekStartsOn: 1 }
      ).map((date) => ({
        date,
        label: format(date, 'd MMM', { locale: es }),
      }));
    case 'quarter':
      return eachMonthOfInterval({ start: startDate, end: endDate }).map((date) => ({
        date,
        label: format(date, 'MMM yyyy', { locale: es }),
      }));
    case 'year':
      // En vista año, solo mostrar cada 2 meses para mejor legibilidad
      const allMonths = eachMonthOfInterval({ start: startDate, end: endDate });
      return allMonths.filter((_, index) => index % 2 === 0).map((date) => ({
        date,
        label: format(date, 'MMM yy', { locale: es }),
      }));
  }
}

export function calculateBarPosition(
  itemStart: Date,
  itemEnd: Date,
  timeScale: d3.ScaleTime<number, number>
): { x: number; width: number; visible: boolean } {
  const scaleStart = timeScale.domain()[0];
  const scaleEnd = timeScale.domain()[1];

  // Clamp dates to visible range
  const clampedStart = new Date(Math.max(itemStart.getTime(), scaleStart.getTime()));
  const clampedEnd = new Date(Math.min(itemEnd.getTime(), scaleEnd.getTime()));

  // Check if bar is visible
  if (clampedStart >= clampedEnd) {
    return { x: 0, width: 0, visible: false };
  }

  const x = timeScale(clampedStart);
  const width = Math.max(timeScale(clampedEnd) - x, 4);

  return { x, width, visible: true };
}

export function calculateProgress(
  fechaInicio: Date,
  fechaFin: Date,
  horasConsumidas?: number,
  presupuestoHoras?: number
): number {
  if (presupuestoHoras && presupuestoHoras > 0 && horasConsumidas !== undefined) {
    return Math.min(100, Math.round((horasConsumidas / presupuestoHoras) * 100));
  }

  const now = new Date();
  const totalDays = differenceInDays(fechaFin, fechaInicio);
  const elapsedDays = differenceInDays(now, fechaInicio);

  if (elapsedDays <= 0) return 0;
  if (elapsedDays >= totalDays) return 100;

  return Math.round((elapsedDays / totalDays) * 100);
}

export function formatDuration(start: Date, end: Date): string {
  const days = differenceInDays(end, start);
  if (days < 7) {
    return `${days} día${days !== 1 ? 's' : ''}`;
  }
  const weeks = Math.round(days / 7);
  if (weeks < 5) {
    return `${weeks} semana${weeks !== 1 ? 's' : ''}`;
  }
  const months = Math.round(days / 30);
  return `${months} mes${months !== 1 ? 'es' : ''}`;
}

export const DEFAULT_GANTT_CONFIG: GanttConfig = {
  startDate: new Date(),
  endDate: new Date(),
  zoom: 'quarter',
  rowHeight: 48,
  headerHeight: 50,
  barHeight: 24,
  padding: 12,
};
