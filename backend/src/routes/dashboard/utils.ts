import { tareasOnboarding } from '../../db/schema/procesos.js';
import { CRITICAL_OVERDUE_DAYS } from './constants.js';

export const toDateString = (date: Date) => date.toISOString().slice(0, 10);

export const getMonthRange = (now: Date) => {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return {
    start,
    end,
    startDate: toDateString(start),
    endDate: toDateString(end),
    today: toDateString(now),
  };
};

export const getRecentDates = (days: number, now: Date) => {
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(base);
    date.setUTCDate(base.getUTCDate() - i);
    dates.push(toDateString(date));
  }
  return dates;
};

export const toNumber = (value: unknown, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const formatNombreCompleto = (nombre?: string | null, apellidos?: string | null) =>
  [nombre, apellidos].filter(Boolean).join(' ').trim();

const mapTareaPriority = (prioridad?: string | null, overdueDays = 0) => {
  if (overdueDays >= CRITICAL_OVERDUE_DAYS) return 'CRITICA';
  if (prioridad === 'ALTA' || prioridad === 'URGENTE') return 'ALTA';
  if (prioridad === 'BAJA') return 'BAJA';
  return 'MEDIA';
};

export const buildAlertsFromTareas = (
  rows: Array<typeof tareasOnboarding.$inferSelect>,
  now: Date
) => {
  return rows.map((tarea) => {
    const limite = tarea.fechaLimite ? new Date(tarea.fechaLimite) : now;
    const overdueDays = Math.floor((now.getTime() - limite.getTime()) / (1000 * 60 * 60 * 24));
    return {
      id: tarea.id,
      titulo: tarea.titulo,
      descripcion: tarea.descripcion ?? undefined,
      prioridad: mapTareaPriority(tarea.prioridad, overdueDays),
      fecha: tarea.fechaLimite ? new Date(`${tarea.fechaLimite}T00:00:00Z`).toISOString() : undefined,
    };
  });
};
