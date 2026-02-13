import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GanttChart } from '../gantt-chart';

vi.mock('@/components/timetracking/gantt-tooltip', () => ({
  GanttTooltip: ({ nombre, visible }: { nombre: string; visible: boolean }) => (
    visible ? <div data-testid="tooltip">{nombre}</div> : null
  ),
}));

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

describe('GanttChart', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get: () => 900,
    });
  });

  it('muestra loading y estado vacío', () => {
    const { rerender, container } = render(<GanttChart proyectos={[]} isLoading />);
    expect(container.querySelectorAll('[class*="skeleton"], [class*="animate-pulse"]').length).toBeGreaterThan(0);

    rerender(<GanttChart proyectos={[]} isLoading={false} />);
    expect(screen.getByText(/no hay proyectos con fechas definidas/i)).toBeInTheDocument();
  });

  it('renderiza gráfico con leyenda y permite cambiar zoom', async () => {
    const user = userEvent.setup();

    render(
      <GanttChart
        isLoading={false}
        proyectos={[
          {
            id: 'p1',
            nombre: 'Proyecto Uno',
            codigo: 'P1',
            estado: 'ACTIVO',
            fechaInicio: new Date('2026-01-02'),
            fechaFin: new Date('2026-02-20'),
            progreso: 60,
            asignaciones: [
              {
                id: 'a1',
                usuarioNombre: 'Ana',
                fechaInicio: new Date('2026-01-02'),
                fechaFin: new Date('2026-01-20'),
              },
            ],
          },
        ] as never[]}
      />
    );

    expect(screen.getByText('Diagrama Gantt')).toBeInTheDocument();
    expect(screen.getByText('Proyecto Uno')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^mes$/i }));
    await user.click(screen.getByRole('button', { name: /^año$/i }));
    expect(screen.getByText('Zoom:')).toBeInTheDocument();
  });
});
