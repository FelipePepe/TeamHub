import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskGanttChart } from '../task-gantt-chart';

vi.mock('@/lib/gantt-utils', () => ({
  DEFAULT_GANTT_CONFIG: {
    headerHeight: 40,
    rowHeight: 40,
    barHeight: 16,
    padding: 10,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-03-31'),
  },
  getDateRange: () => ({ start: new Date('2026-01-01'), end: new Date('2026-03-31') }),
  createTimeScale: () => (date: Date) => (date.getTime() % 1000) / 10,
  getHeaderIntervals: () => [{ date: new Date('2026-01-01'), label: 'Ene' }],
  calculateBarPosition: () => ({ x: 20, width: 120, visible: true }),
}));

describe('TaskGanttChart', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get: () => 900,
    });
  });

  it('renderiza loading y estado vacío', () => {
    const { rerender, container } = render(<TaskGanttChart tareas={[]} isLoading />);
    expect(container.querySelectorAll('[class*="skeleton"], [class*="animate-pulse"]').length).toBeGreaterThan(0);

    rerender(<TaskGanttChart tareas={[]} isLoading={false} />);
    expect(screen.getByText(/no hay tareas con fechas definidas/i)).toBeInTheDocument();
  });

  it('renderiza gantt de tareas y permite click en tarea', async () => {
    const user = userEvent.setup();
    const onTaskClick = vi.fn();

    render(
      <TaskGanttChart
        isLoading={false}
        onTaskClick={onTaskClick}
        tareas={[
          {
            id: 't1',
            titulo: 'Implementar API',
            estado: 'IN_PROGRESS',
            prioridad: 'HIGH',
            proyectoId: 'p1',
            usuarioAsignado: { id: 'u1', nombre: 'Ana', apellidos: 'Lopez' },
            fechaInicio: '2026-01-02',
            fechaFin: '2026-01-20',
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
          },
        ] as never[]}
      />
    );

    expect(screen.getByText(/diagrama gantt de tareas/i)).toBeInTheDocument();
    expect(screen.getByText(/ana lopez/i)).toBeInTheDocument();

    const svg = document.querySelector('svg');
    if (svg) {
      const clickable = svg.querySelector('g g g');
      if (clickable instanceof SVGElement) {
        await user.click(clickable);
      }
    }

    expect(onTaskClick).toHaveBeenCalledTimes(1);
  });
});
