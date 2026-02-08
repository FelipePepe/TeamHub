'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ESTADO_COLORS, ESTADO_LABELS } from '@/types/timetracking';
import type { ProyectoEstado } from '@/hooks/use-proyectos';
import { formatDuration } from '@/lib/gantt-utils';

interface GanttTooltipProps {
  nombre: string;
  codigo: string;
  estado: ProyectoEstado;
  fechaInicio: Date;
  fechaFin: Date;
  progreso: number;
  position: { x: number; y: number };
  visible: boolean;
}

export function GanttTooltip({
  nombre,
  codigo,
  estado,
  fechaInicio,
  fechaFin,
  progreso,
  position,
  visible,
}: GanttTooltipProps) {
  if (!visible) return null;

  return (
    <Card
      className="pointer-events-none absolute z-50 min-w-[200px] p-3 shadow-lg"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
        marginTop: -8,
      }}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">{nombre}</div>
            <div className="text-xs text-muted-foreground">{codigo}</div>
          </div>
          <Badge
            style={{ backgroundColor: ESTADO_COLORS[estado] }}
            className="text-white"
          >
            {ESTADO_LABELS[estado]}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="text-muted-foreground">Inicio:</div>
          <div>{format(fechaInicio, 'd MMM yyyy', { locale: es })}</div>
          <div className="text-muted-foreground">Fin:</div>
          <div>{format(fechaFin, 'd MMM yyyy', { locale: es })}</div>
          <div className="text-muted-foreground">Duración:</div>
          <div>{formatDuration(fechaInicio, fechaFin)}</div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium">{progreso}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progreso}%`,
                backgroundColor: ESTADO_COLORS[estado],
              }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
