'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ChartDataPoint } from '@/types/dashboard';

interface BarChartProps {
  title: string;
  description?: string;
  data: ChartDataPoint[];
  isLoading?: boolean;
  height?: number;
}

const COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-indigo-500',
];

export function BarChart({
  title,
  description,
  data,
  isLoading = false,
  height = 200,
}: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2" style={{ height }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="flex-1" style={{ height: `${Math.random() * 60 + 20}%` }} />
            ))}
          </div>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2" style={{ height }}>
          {data.map((item, index) => (
            <div key={item.id} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-medium text-slate-600">{item.value}</span>
              <div
                className={`w-full rounded-t ${COLORS[index % COLORS.length]} transition-all`}
                style={{ height: `${(item.value / maxValue) * 100}%`, minHeight: item.value > 0 ? 4 : 0 }}
              />
              <span className="text-xs text-slate-500 truncate w-full text-center" title={item.label}>
                {item.label.length > 8 ? `${item.label.slice(0, 8)}...` : item.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
