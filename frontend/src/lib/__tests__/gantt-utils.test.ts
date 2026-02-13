import { describe, it, expect } from 'vitest';
import {
  getDateRange,
  createTimeScale,
  getHeaderIntervals,
  calculateBarPosition,
  calculateProgress,
  formatDuration,
} from '../gantt-utils';

describe('lib/gantt-utils', () => {
  it('genera rangos e intervalos', () => {
    const month = getDateRange('month');
    const quarter = getDateRange('quarter');
    const year = getDateRange('year');

    expect(month.start.getTime()).toBeLessThan(month.end.getTime());
    expect(quarter.start.getTime()).toBeLessThan(quarter.end.getTime());
    expect(year.start.getTime()).toBeLessThan(year.end.getTime());

    expect(getHeaderIntervals(month.start, month.end, 'month').length).toBeGreaterThan(0);
    expect(getHeaderIntervals(quarter.start, quarter.end, 'quarter').length).toBeGreaterThan(0);
    expect(getHeaderIntervals(year.start, year.end, 'year').length).toBeGreaterThan(0);
  });

  it('calcula barras, progreso y duración', () => {
    const start = new Date('2026-01-01');
    const end = new Date('2026-02-01');
    const scale = createTimeScale(start, end, 1000);

    const bar = calculateBarPosition(new Date('2026-01-05'), new Date('2026-01-20'), scale);
    expect(bar.visible).toBe(true);
    expect(bar.width).toBeGreaterThan(0);

    const progressByHours = calculateProgress(start, end, 20, 40);
    expect(progressByHours).toBe(50);

    const duration = formatDuration(new Date('2026-01-01'), new Date('2026-01-10'));
    expect(duration).toMatch(/día|semana|mes/);
  });
});
