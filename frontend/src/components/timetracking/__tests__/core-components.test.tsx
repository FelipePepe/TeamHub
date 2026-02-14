import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WeekNavigation } from '../week-navigation';
import { TimesheetCell } from '../timesheet-cell';
import { TimesheetGrid } from '../timesheet-grid';
import { CopyWeekDialog } from '../copy-week-dialog';
import { GanttTooltip } from '../gantt-tooltip';
import { GanttZoomControls } from '../gantt-zoom-controls';

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

describe('WeekNavigation', () => {
  it('navega semanas y permite copiar', async () => {
    const user = userEvent.setup();
    const onDateChange = vi.fn();
    const onCopyWeek = vi.fn();

    render(
      <WeekNavigation
        currentDate={new Date('2026-01-15')}
        onDateChange={onDateChange}
        onCopyWeek={onCopyWeek}
      />
    );

    await user.click(screen.getByLabelText(/semana anterior/i));
    await user.click(screen.getByLabelText(/semana siguiente/i));
    await user.click(screen.getByRole('button', { name: /copiar semana anterior/i }));

    expect(onDateChange).toHaveBeenCalledTimes(2);
    expect(onCopyWeek).toHaveBeenCalled();
  });
});

describe('TimesheetCell', () => {
  it('permite editar y guardar horas', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TimesheetCell value={2} onChange={onChange} />);

    await user.click(screen.getByText('2h'));
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '5');
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('no edita cuando está disabled', async () => {
    const user = userEvent.setup();
    render(<TimesheetCell value={0} onChange={vi.fn()} disabled />);

    await user.click(screen.getByText('-'));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});

describe('TimesheetGrid', () => {
  it('renderiza loading y luego la grilla con totales', () => {
    const { rerender, container } = render(
      <TimesheetGrid
        currentDate={new Date('2026-01-12')}
        registros={[]}
        proyectos={[]}
        isLoading
        onCellChange={vi.fn()}
      />
    );

    expect(container.querySelectorAll('[class*="skeleton"], [class*="animate-pulse"]').length).toBeGreaterThan(0);

    rerender(
      <TimesheetGrid
        currentDate={new Date('2026-01-12')}
        registros={[
          { id: 'r1', proyectoId: 'p1', fecha: '2026-01-12T00:00:00.000Z', horas: 4 },
          { id: 'r2', proyectoId: 'p1', fecha: '2026-01-13T00:00:00.000Z', horas: 2 },
        ] as never[]}
        proyectos={[{ id: 'p1', nombre: 'Proyecto Uno', codigo: 'P1' }]}
        isLoading={false}
        onCellChange={vi.fn()}
      />
    );

    expect(screen.getByText('Proyecto Uno')).toBeInTheDocument();
    expect(screen.getAllByText('6h').length).toBeGreaterThan(0);
  });
});

describe('CopyWeekDialog', () => {
  it('dispara confirmar y cancelar', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();

    render(
      <CopyWeekDialog
        open={true}
        onOpenChange={onOpenChange}
        currentDate={new Date('2026-01-12')}
        onConfirm={onConfirm}
        isPending={false}
      />
    );

    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    await user.click(screen.getByRole('button', { name: /confirmar copia/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).toHaveBeenCalled();
  });
});

describe('GanttTooltip and GanttZoomControls', () => {
  it('renderiza tooltip visible y cambia zoom', async () => {
    const user = userEvent.setup();
    const onZoomChange = vi.fn();

    const { rerender } = render(
      <GanttTooltip
        nombre="Proyecto X"
        codigo="PX"
        estado="ACTIVO"
        fechaInicio={new Date('2026-01-01')}
        fechaFin={new Date('2026-02-01')}
        progreso={55}
        position={{ x: 10, y: 20 }}
        visible={false}
      />
    );

    expect(screen.queryByText('Proyecto X')).not.toBeInTheDocument();

    rerender(
      <div>
        <GanttTooltip
          nombre="Proyecto X"
          codigo="PX"
          estado="ACTIVO"
          fechaInicio={new Date('2026-01-01')}
          fechaFin={new Date('2026-02-01')}
          progreso={55}
          position={{ x: 10, y: 20 }}
          visible={true}
        />
        <GanttZoomControls zoom="month" onZoomChange={onZoomChange} />
      </div>
    );

    expect(screen.getByText('Proyecto X')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /trimestre/i }));
    expect(onZoomChange).toHaveBeenCalledWith('quarter');
  });
});
