import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Users } from 'lucide-react';
import { KpiCard } from '../kpi-card';
import { ActivityList, AlertList } from '../activity-list';

describe('KpiCard', () => {
  it('renderiza estado loading', () => {
    const { container } = render(
      <KpiCard title="Usuarios" value={0} icon={Users} isLoading />
    );

    expect(container.querySelectorAll('[class*="animate-pulse"], [class*="skeleton"]').length).toBeGreaterThan(0);
  });

  it('renderiza valor, descripcion y tendencia', () => {
    render(
      <KpiCard
        title="Usuarios"
        value={42}
        icon={Users}
        description="Activos"
        trend={{ value: 10, isPositive: true }}
        variant="success"
      />
    );

    expect(screen.getByText('Usuarios')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Activos')).toBeInTheDocument();
    expect(screen.getByText('+10% vs mes anterior')).toBeInTheDocument();
  });
});

describe('ActivityList', () => {
  it('renderiza estado vacío', () => {
    render(<ActivityList title="Actividad" items={[]} emptyMessage="Nada" />);
    expect(screen.getByText('Nada')).toBeInTheDocument();
  });

  it('abre detalle de actividad al hacer click', async () => {
    const user = userEvent.setup();

    render(
      <ActivityList
        title="Actividad"
        items={[
          {
            id: 'a-1',
            tipo: 'manual',
            descripcion: 'Actividad manual',
            operation: 'UPDATE',
            tableName: 'users',
            recordId: 'u-1',
            changedFields: ['nombre'],
            usuarioEmail: 'admin@test.com',
            fecha: '2026-01-10T10:00:00Z',
            oldData: { nombre: 'Old' },
            newData: { nombre: 'New' },
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: /ver detalle/i }));

    expect(screen.getByText(/detalle de actividad/i)).toBeInTheDocument();
    expect(screen.getByText(/UPDATE users SET nombre WHERE id = 'u-1'/i)).toBeInTheDocument();
    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
  });
});

describe('AlertList', () => {
  it('renderiza loading y lista de alertas', () => {
    const { rerender, container } = render(<AlertList title="Alertas" items={[]} isLoading />);
    expect(container.querySelectorAll('[class*="animate-pulse"], [class*="skeleton"]').length).toBeGreaterThan(0);

    rerender(
      <AlertList
        title="Alertas"
        items={[
          {
            id: 'al-1',
            titulo: 'Tarea vencida',
            prioridad: 'CRITICA',
            descripcion: 'Descripción',
            fecha: '2026-01-12',
          },
        ]}
      />
    );

    expect(screen.getByText('Tarea vencida')).toBeInTheDocument();
    expect(screen.getByText('CRITICA')).toBeInTheDocument();
  });
});
