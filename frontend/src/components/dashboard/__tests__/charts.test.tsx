import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BarChart } from '../bar-chart';
import { LineChart } from '../line-chart';
import type { ChartDataPoint, TimeSeriesPoint } from '@/types/dashboard';

// Mock ResizeObserver for D3 container measurements
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    vi.fn(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }))
  );

  // Mock clientWidth/clientHeight for container refs
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => 600,
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get: () => 400,
  });
});

const barData: ChartDataPoint[] = [
  { id: '1', label: 'ADMIN', value: 5 },
  { id: '2', label: 'MANAGER', value: 12 },
  { id: '3', label: 'EMPLEADO', value: 30 },
];

const lineData: TimeSeriesPoint[] = [
  { fecha: '2026-01-01', value: 10 },
  { fecha: '2026-01-08', value: 25 },
  { fecha: '2026-01-15', value: 18 },
  { fecha: '2026-01-22', value: 32 },
];

describe('BarChart', () => {
  it('renders title and description', () => {
    render(<BarChart title="Usuarios por rol" description="Distribución" data={barData} />);
    expect(screen.getByText('Usuarios por rol')).toBeInTheDocument();
    expect(screen.getByText('Distribución')).toBeInTheDocument();
  });

  it('renders SVG element with data', () => {
    const { container } = render(<BarChart title="Test" data={barData} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading', () => {
    const { container } = render(<BarChart title="Test" data={[]} isLoading />);
    const skeletons = container.querySelectorAll('[class*="skeleton"], [class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state when no data', () => {
    render(<BarChart title="Test" data={[]} />);
    expect(screen.getByText('Sin datos')).toBeInTheDocument();
  });

  it('has ARIA label for accessibility', () => {
    render(<BarChart title="Usuarios por rol" data={barData} />);
    expect(screen.getByRole('img', { name: /gráfico de barras/i })).toBeInTheDocument();
  });
});

describe('LineChart', () => {
  it('renders title and description', () => {
    render(<LineChart title="Horas semanales" description="Tendencia" data={lineData} />);
    expect(screen.getByText('Horas semanales')).toBeInTheDocument();
    expect(screen.getByText('Tendencia')).toBeInTheDocument();
  });

  it('renders SVG element with data', () => {
    const { container } = render(<LineChart title="Test" data={lineData} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading', () => {
    const { container } = render(<LineChart title="Test" data={[]} isLoading />);
    const skeletons = container.querySelectorAll('[class*="skeleton"], [class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state when no data', () => {
    render(<LineChart title="Test" data={[]} />);
    expect(screen.getByText('Sin datos')).toBeInTheDocument();
  });

  it('has ARIA label for accessibility', () => {
    render(<LineChart title="Horas semanales" data={lineData} />);
    expect(screen.getByRole('img', { name: /gráfico de línea/i })).toBeInTheDocument();
  });
});
