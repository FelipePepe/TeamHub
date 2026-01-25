'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { TimeSeriesPoint } from '@/types/dashboard';

interface LineChartProps {
  title: string;
  description?: string;
  data: TimeSeriesPoint[];
  isLoading?: boolean;
  height?: number;
  formatLabel?: (fecha: string) => string;
}

const defaultFormatLabel = (fecha: string) => {
  const date = new Date(fecha);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
};

export function LineChart({
  title,
  description,
  data,
  isLoading = false,
  height = 200,
  formatLabel = defaultFormatLabel,
}: LineChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full" style={{ height }} />
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center text-slate-400" style={{ height }}>
            Sin datos
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate points for SVG path
  const padding = 40;
  const chartWidth = 100; // percentage
  const pointWidth = (chartWidth - padding * 2 / 300 * 100) / (data.length - 1 || 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ height }}>
          <svg viewBox={`0 0 300 ${height}`} className="w-full h-full" preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1={padding}
                y1={height - padding - (height - padding * 2) * ratio}
                x2={300 - padding}
                y2={height - padding - (height - padding * 2) * ratio}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            ))}

            {/* Line path */}
            <path
              d={data
                .map((point, index) => {
                  const x = padding + (index / (data.length - 1 || 1)) * (300 - padding * 2);
                  const y = height - padding - (point.value / maxValue) * (height - padding * 2);
                  return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
            />

            {/* Area fill */}
            <path
              d={
                data
                  .map((point, index) => {
                    const x = padding + (index / (data.length - 1 || 1)) * (300 - padding * 2);
                    const y = height - padding - (point.value / maxValue) * (height - padding * 2);
                    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ') +
                ` L ${300 - padding} ${height - padding} L ${padding} ${height - padding} Z`
              }
              fill="url(#gradient)"
              opacity="0.1"
            />

            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Data points */}
            {data.map((point, index) => {
              const x = padding + (index / (data.length - 1 || 1)) * (300 - padding * 2);
              const y = height - padding - (point.value / maxValue) * (height - padding * 2);
              return (
                <circle
                  key={point.fecha}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#3b82f6"
                  className="hover:r-6 transition-all"
                />
              );
            })}
          </svg>

          {/* X-axis labels */}
          <div className="flex justify-between px-10 -mt-2">
            {data.filter((_, i) => i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2)).map((point) => (
              <span key={point.fecha} className="text-xs text-slate-400">
                {formatLabel(point.fecha)}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
