'use client';

import { useMemo, useCallback } from 'react';
import { format, startOfWeek, addDays, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import { TimesheetCell } from './timesheet-cell';
import { Skeleton } from '@/components/ui/skeleton';
import type { TimeEntry } from '@/hooks/use-timetracking';

interface Proyecto {
  id: string;
  nombre: string;
  codigo: string;
}

interface TimesheetGridProps {
  currentDate: Date;
  registros: TimeEntry[];
  proyectos: Proyecto[];
  isLoading: boolean;
  onCellChange: (proyectoId: string, fecha: string, horas: number) => void;
}

export function TimesheetGrid({
  currentDate,
  registros,
  proyectos,
  isLoading,
  onCellChange,
}: TimesheetGridProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

  const dias = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const horasPorProyectoYDia = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    registros.forEach((r) => {
      if (!map[r.proyectoId]) {
        map[r.proyectoId] = {};
      }
      const fechaKey = r.fecha.split('T')[0];
      map[r.proyectoId][fechaKey] = (map[r.proyectoId][fechaKey] || 0) + r.horas;
    });
    return map;
  }, [registros]);

  const proyectosConHoras = useMemo(() => {
    const proyectoIds = new Set([
      ...proyectos.map((p) => p.id),
      ...Object.keys(horasPorProyectoYDia),
    ]);
    return Array.from(proyectoIds).map((id) => {
      const proyecto = proyectos.find((p) => p.id === id);
      return {
        id,
        nombre: proyecto?.nombre || 'Proyecto desconocido',
        codigo: proyecto?.codigo || '???',
      };
    });
  }, [proyectos, horasPorProyectoYDia]);

  const totalPorDia = useMemo(() => {
    const totales: Record<string, number> = {};
    dias.forEach((dia) => {
      const fechaKey = format(dia, 'yyyy-MM-dd');
      totales[fechaKey] = Object.values(horasPorProyectoYDia).reduce(
        (sum, proyectoHoras) => sum + (proyectoHoras[fechaKey] || 0),
        0
      );
    });
    return totales;
  }, [dias, horasPorProyectoYDia]);

  const totalSemana = useMemo(() => {
    return Object.values(totalPorDia).reduce((sum, h) => sum + h, 0);
  }, [totalPorDia]);

  const getTotalProyecto = useCallback(
    (proyectoId: string) => {
      return Object.values(horasPorProyectoYDia[proyectoId] || {}).reduce(
        (sum, h) => sum + h,
        0
      );
    },
    [horasPorProyectoYDia]
  );

  const getHoras = useCallback(
    (proyectoId: string, fecha: string) => {
      return horasPorProyectoYDia[proyectoId]?.[fecha] || 0;
    },
    [horasPorProyectoYDia]
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Header */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <div className="flex w-40 shrink-0 items-center border-r border-slate-200 px-3 py-2 font-medium text-slate-700">
            Proyecto
          </div>
          {dias.map((dia) => (
            <div
              key={dia.toISOString()}
              className={`flex h-10 w-16 flex-col items-center justify-center border-r border-slate-200 text-xs ${
                isWeekend(dia) ? 'bg-slate-100' : ''
              }`}
            >
              <span className="font-medium">{format(dia, 'EEE', { locale: es })}</span>
              <span className="text-slate-500">{format(dia, 'd')}</span>
            </div>
          ))}
          <div className="flex w-16 items-center justify-center bg-slate-100 px-2 font-medium text-slate-700">
            Total
          </div>
        </div>

        {/* Filas de proyectos */}
        {proyectosConHoras.length === 0 ? (
          <div className="flex h-20 items-center justify-center text-sm text-slate-500">
            No hay proyectos asignados. Registra horas para ver proyectos aquí.
          </div>
        ) : (
          proyectosConHoras.map((proyecto) => (
            <div key={proyecto.id} className="flex border-b border-slate-200 hover:bg-slate-50/50">
              <div className="flex w-40 shrink-0 items-center border-r border-slate-200 px-3 py-2">
                <div className="truncate">
                  <div className="truncate text-sm font-medium text-slate-900">
                    {proyecto.nombre}
                  </div>
                  <div className="text-xs text-slate-500">{proyecto.codigo}</div>
                </div>
              </div>
              {dias.map((dia) => {
                const fechaKey = format(dia, 'yyyy-MM-dd');
                return (
                  <TimesheetCell
                    key={fechaKey}
                    value={getHoras(proyecto.id, fechaKey)}
                    onChange={(horas) => onCellChange(proyecto.id, fechaKey, horas)}
                    isWeekend={isWeekend(dia)}
                  />
                );
              })}
              <div className="flex w-16 items-center justify-center bg-slate-50 px-2 text-sm font-semibold text-slate-900">
                {getTotalProyecto(proyecto.id)}h
              </div>
            </div>
          ))
        )}

        {/* Fila de totales */}
        <div className="flex border-b border-slate-300 bg-slate-100">
          <div className="flex w-40 shrink-0 items-center border-r border-slate-200 px-3 py-2 font-semibold text-slate-700">
            Total
          </div>
          {dias.map((dia) => {
            const fechaKey = format(dia, 'yyyy-MM-dd');
            return (
              <div
                key={fechaKey}
                className={`flex h-10 w-16 items-center justify-center border-r border-slate-200 text-sm font-semibold ${
                  isWeekend(dia) ? 'bg-slate-150' : ''
                }`}
              >
                {totalPorDia[fechaKey] > 0 ? `${totalPorDia[fechaKey]}h` : '-'}
              </div>
            );
          })}
          <div className="flex w-16 items-center justify-center bg-blue-50 px-2 text-sm font-bold text-blue-700">
            {totalSemana}h
          </div>
        </div>
      </div>
    </div>
  );
}
