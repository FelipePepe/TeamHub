'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  readonly title: string;
  readonly value: number | string;
  readonly icon: LucideIcon;
  readonly description?: string;
  readonly trend?: {
    readonly value: number;
    readonly isPositive: boolean;
  };
  readonly variant?: 'default' | 'success' | 'warning' | 'danger';
  readonly isLoading?: boolean;
}

const variantStyles = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200',
  danger: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-200',
};

/**
 * Renderiza una tarjeta KPI con estilos accesibles en tema claro/oscuro.
 * @param props - Props para título, valor, icono y variantes visuales.
 * @returns Tarjeta KPI con icono, métricas y estados opcionales.
 */
export function KpiCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  variant = 'default',
  isLoading = false,
}: KpiCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-12 w-12 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {trend && (
              <p
                className={cn(
                  'text-xs mt-1',
                  trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                )}
              >
                {trend.isPositive ? '+' : ''}{trend.value}% vs mes anterior
              </p>
            )}
          </div>
          <div className={cn('p-3 rounded-lg', variantStyles[variant])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
