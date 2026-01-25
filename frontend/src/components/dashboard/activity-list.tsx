'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Activity } from 'lucide-react';
import type { ActivityItem, AlertItem } from '@/types/dashboard';

interface ActivityListProps {
  title: string;
  description?: string;
  items: ActivityItem[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function ActivityList({
  title,
  description,
  items,
  isLoading = false,
  emptyMessage = 'Sin actividad reciente',
}: ActivityListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
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
        {items.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">{emptyMessage}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-slate-100">
                  <Activity className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{item.descripcion}</p>
                  {item.fecha && (
                    <p className="text-xs text-slate-400">
                      {new Date(item.fecha).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

interface AlertListProps {
  title: string;
  description?: string;
  items: AlertItem[];
  isLoading?: boolean;
  emptyMessage?: string;
}

const priorityStyles = {
  CRITICA: 'bg-red-100 text-red-700 border-red-200',
  ALTA: 'bg-orange-100 text-orange-700 border-orange-200',
  MEDIA: 'bg-amber-100 text-amber-700 border-amber-200',
  BAJA: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function AlertList({
  title,
  description,
  items,
  isLoading = false,
  emptyMessage = 'Sin alertas',
}: AlertListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
              <Skeleton className="h-5 w-5" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
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
        {items.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">{emptyMessage}</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className={`flex items-start gap-3 p-3 border rounded-lg ${priorityStyles[item.prioridad]}`}
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{item.titulo}</p>
                    <Badge variant="outline" className="text-xs">
                      {item.prioridad}
                    </Badge>
                  </div>
                  {item.descripcion && (
                    <p className="text-xs opacity-80 mt-0.5 truncate">{item.descripcion}</p>
                  )}
                  {item.fecha && (
                    <p className="text-xs opacity-60 mt-1">
                      Vence: {new Date(item.fecha).toLocaleDateString('es-ES')}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
