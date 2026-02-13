'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { GanttZoomControls } from '@/components/timetracking/gantt-zoom-controls';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { Tarea, EstadoTarea } from '@/types';
import type { GanttZoomLevel, GanttConfig } from '@/types/timetracking';
import {
  getDateRange,
  createTimeScale,
  getHeaderIntervals,
  calculateBarPosition,
  DEFAULT_GANTT_CONFIG,
} from '@/lib/gantt-utils';

interface TaskGanttChartProps {
  readonly tareas: Tarea[];
  readonly onTaskClick?: (tarea: Tarea) => void;
  readonly isLoading?: boolean;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  tarea: Tarea | null;
}

interface PreparedTaskRow {
  tarea: Tarea;
  rowY: number;
  barY: number;
  isEven: boolean;
}

interface PreparedSwimlane {
  key: string;
  name: string;
  headerY: number;
  tasks: PreparedTaskRow[];
}

const ESTADO_COLORS: Record<EstadoTarea, string> = {
  TODO: '#71717a',
  IN_PROGRESS: '#3b82f6',
  REVIEW: '#f97316',
  DONE: '#22c55e',
  BLOCKED: '#ef4444',
};

const ESTADO_LABELS: Record<EstadoTarea, string> = {
  TODO: 'Por hacer',
  IN_PROGRESS: 'En progreso',
  REVIEW: 'En revisión',
  DONE: 'Completada',
  BLOCKED: 'Bloqueada',
};
const LOADING_GANTT_ROW_KEYS = ['loading-1', 'loading-2', 'loading-3', 'loading-4', 'loading-5'] as const;

export function TaskGanttChart({ tareas, onTaskClick, isLoading }: TaskGanttChartProps) {
  const [zoom, setZoom] = useState<GanttZoomLevel>('quarter');
  const [chartWidth, setChartWidth] = useState(800);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    tarea: null,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const config: GanttConfig = { ...DEFAULT_GANTT_CONFIG, zoom };
  const { start, end } = getDateRange(zoom);
  config.startDate = start;
  config.endDate = end;

  const labelWidth = 200;

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setChartWidth(Math.max(width, 600));
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Filtrar tareas con fechas
  const tareasConFechas = useMemo(
    () =>
      tareas.filter(
        (t) => t.fechaInicio && t.fechaFin
      ),
    [tareas]
  );

  // Agrupar por usuario (swimlanes)
  const swimlanes = useMemo(() => {
    const grouped = new Map<string, Tarea[]>();
    const sinAsignar: Tarea[] = [];

    tareasConFechas.forEach((tarea) => {
      if (tarea.usuarioAsignado) {
        const key = tarea.usuarioAsignado.id;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(tarea);
      } else {
        sinAsignar.push(tarea);
      }
    });

    const lanes: { key: string; name: string; tareas: Tarea[] }[] = Array.from(
      grouped.entries()
    ).map(([key, tareas]) => ({
      key,
      name: tareas[0].usuarioAsignado
        ? `${tareas[0].usuarioAsignado.nombre} ${tareas[0].usuarioAsignado.apellidos || ''}`.trim()
        : 'Sin asignar',
      tareas,
    }));

    if (sinAsignar.length > 0) {
      lanes.push({ key: 'sin-asignar', name: 'Sin asignar', tareas: sinAsignar });
    }

    return lanes;
  }, [tareasConFechas]);

  const timeScale = useMemo(
    () => createTimeScale(config.startDate, config.endDate, chartWidth - labelWidth),
    [config.startDate, config.endDate, chartWidth]
  );

  const headerIntervals = useMemo(
    () => getHeaderIntervals(config.startDate, config.endDate, zoom),
    [config.startDate, config.endDate, zoom]
  );

  const handleMouseEnter = (e: React.MouseEvent, tarea: Tarea) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltip({
        visible: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        tarea,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (tooltip.visible) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltip((prev) => ({
          ...prev,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        }));
      }
    }
  };

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  const handleTaskClick = (tarea: Tarea) => {
    if (onTaskClick) {
      onTaskClick(tarea);
    }
  };

  const preparedSwimlanes = useMemo<PreparedSwimlane[]>(() => {
    let currentY = config.headerHeight;
    const lanes: PreparedSwimlane[] = [];

    for (const lane of swimlanes) {
      const headerY = currentY;
      const taskRows: PreparedTaskRow[] = [];

      currentY += config.rowHeight;
      for (const [index, tarea] of lane.tareas.entries()) {
        const rowY = currentY;
        const barY = rowY + (config.rowHeight - config.barHeight) / 2;

        taskRows.push({
          tarea,
          rowY,
          barY,
          isEven: index % 2 === 0,
        });

        currentY += config.rowHeight;
      }

      lanes.push({
        key: lane.key,
        name: lane.name,
        headerY,
        tasks: taskRows,
      });
    }

    return lanes;
  }, [config.barHeight, config.headerHeight, config.rowHeight, swimlanes]);

  const totalRows = swimlanes.reduce((sum, lane) => sum + 1 + lane.tareas.length, 0);
  const todayX = timeScale(new Date()) + labelWidth;
  const showTodayLine = todayX >= labelWidth && todayX <= chartWidth;

  const totalHeight = config.headerHeight + totalRows * config.rowHeight + config.padding * 2;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Diagrama Gantt de Tareas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            {LOADING_GANTT_ROW_KEYS.map((key) => (
              <Skeleton key={key} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tareasConFechas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Diagrama Gantt de Tareas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center text-sm text-slate-500">
            No hay tareas con fechas definidas
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Diagrama Gantt de Tareas</CardTitle>
        <GanttZoomControls zoom={zoom} onZoomChange={setZoom} />
      </CardHeader>
      <CardContent>
        <div
          ref={containerRef}
          className="relative w-full overflow-x-auto"
          onMouseMove={handleMouseMove}
        >
          <svg width={chartWidth} height={totalHeight} className="min-w-full">
            {/* Grid de fondo */}
            <g>
              {headerIntervals.map((interval) => {
                const x = timeScale(interval.date) + labelWidth;
                return (
                  <line
                    key={`grid-${interval.date.toISOString()}-${interval.label}`}
                    x1={x}
                    y1={config.headerHeight}
                    x2={x}
                    y2={totalHeight}
                    stroke="#e2e8f0"
                    strokeWidth={1}
                  />
                );
              })}
            </g>

            {/* Header */}
            <g>
              <rect
                x={0}
                y={0}
                width={chartWidth}
                height={config.headerHeight}
                fill="#f8fafc"
              />
              <line
                x1={0}
                y1={config.headerHeight}
                x2={chartWidth}
                y2={config.headerHeight}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
              <text
                x={config.padding}
                y={config.headerHeight / 2}
                dominantBaseline="middle"
                className="fill-slate-700 text-sm font-medium"
              >
                Tarea / Asignado a
              </text>
              {headerIntervals.map((interval) => {
                const x = timeScale(interval.date) + labelWidth;
                return (
                  <text
                    key={`header-${interval.date.toISOString()}-${interval.label}`}
                    x={x + 4}
                    y={config.headerHeight / 2}
                    dominantBaseline="middle"
                    className="fill-slate-600 text-xs"
                  >
                    {interval.label}
                  </text>
                );
              })}
            </g>

            {/* Línea "Hoy" */}
            <g>
              {showTodayLine && (
                <>
                  <line
                    x1={todayX}
                    y1={config.headerHeight}
                    x2={todayX}
                    y2={totalHeight}
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="4,4"
                  />
                  <text
                    x={todayX}
                    y={config.headerHeight - 4}
                    textAnchor="middle"
                    className="fill-red-500 text-[10px]"
                  >
                    Hoy
                  </text>
                </>
              )}
            </g>

            {/* Swimlanes */}
            {preparedSwimlanes.map((lane) => (
              <g key={lane.key}>
                {/* Header del swimlane */}
                <rect
                  x={0}
                  y={lane.headerY}
                  width={chartWidth}
                  height={config.rowHeight}
                  fill="#f1f5f9"
                />
                <line
                  x1={0}
                  y1={lane.headerY + config.rowHeight}
                  x2={chartWidth}
                  y2={lane.headerY + config.rowHeight}
                  stroke="#cbd5e1"
                  strokeWidth={1}
                />
                <text
                  x={config.padding}
                  y={lane.headerY + config.rowHeight / 2}
                  dominantBaseline="middle"
                  className="fill-slate-900 text-sm font-semibold"
                >
                  {lane.name}
                </text>

                {/* Tareas del swimlane */}
                {lane.tasks.map((row) => {
                  const bar = calculateBarPosition(
                    new Date(row.tarea.fechaInicio!),
                    new Date(row.tarea.fechaFin!),
                    timeScale
                  );

                  return (
                    <g key={row.tarea.id}>
                      <rect
                        x={0}
                        y={row.rowY}
                        width={chartWidth}
                        height={config.rowHeight}
                        fill={row.isEven ? '#ffffff' : '#f8fafc'}
                      />
                      <line
                        x1={0}
                        y1={row.rowY + config.rowHeight}
                        x2={chartWidth}
                        y2={row.rowY + config.rowHeight}
                        stroke="#e2e8f0"
                        strokeWidth={1}
                      />

                      {/* Label de la tarea */}
                      <text
                        x={config.padding}
                        y={row.rowY + config.rowHeight / 2}
                        dominantBaseline="middle"
                        className="fill-slate-900 text-xs"
                      >
                        {row.tarea.titulo.length > 28
                          ? row.tarea.titulo.slice(0, 28) + '...'
                          : row.tarea.titulo}
                      </text>

                      {/* Barra de la tarea */}
                      {bar.visible && (
                        <g
                          onMouseEnter={(e) => handleMouseEnter(e, row.tarea)}
                          onMouseLeave={handleMouseLeave}
                          onClick={() => handleTaskClick(row.tarea)}
                          style={{ cursor: 'pointer' }}
                        >
                          <rect
                            x={bar.x + labelWidth}
                            y={row.barY}
                            width={bar.width}
                            height={config.barHeight}
                            rx={4}
                            fill={ESTADO_COLORS[row.tarea.estado]}
                            opacity={0.85}
                          />
                          {bar.width > 40 && (
                            <text
                              x={bar.x + labelWidth + bar.width / 2}
                              y={row.barY + config.barHeight / 2}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="fill-white text-xs font-medium"
                              style={{ pointerEvents: 'none' }}
                            >
                              {ESTADO_LABELS[row.tarea.estado]}
                            </text>
                          )}
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            ))}
          </svg>

          {/* Leyenda */}
          <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-200 pt-4">
            {(Object.keys(ESTADO_COLORS) as EstadoTarea[]).map((estado) => (
              <div key={estado} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: ESTADO_COLORS[estado] }}
                />
                <span className="text-xs text-slate-600">{ESTADO_LABELS[estado]}</span>
              </div>
            ))}
          </div>

          {/* Tooltip */}
          {tooltip.tarea && tooltip.visible && (
            <div
              className="pointer-events-none absolute z-50 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-lg"
              style={{
                left: tooltip.x + 10,
                top: tooltip.y + 10,
              }}
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{tooltip.tarea.titulo}</p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{ color: ESTADO_COLORS[tooltip.tarea.estado] }}
                  >
                    {ESTADO_LABELS[tooltip.tarea.estado]}
                  </Badge>
                </div>
                <div className="text-xs text-slate-600">
                  <p>
                    <strong>Asignado:</strong>{' '}
                    {tooltip.tarea.usuarioAsignado
                      ? `${tooltip.tarea.usuarioAsignado.nombre} ${tooltip.tarea.usuarioAsignado.apellidos || ''}`
                      : 'Sin asignar'}
                  </p>
                  {tooltip.tarea.fechaInicio && tooltip.tarea.fechaFin && (
                    <p>
                      <strong>Fechas:</strong>{' '}
                      {format(new Date(tooltip.tarea.fechaInicio), 'd MMM', { locale: es })} -{' '}
                      {format(new Date(tooltip.tarea.fechaFin), 'd MMM yyyy', { locale: es })}
                    </p>
                  )}
                  {tooltip.tarea.horasEstimadas && (
                    <p>
                      <strong>Horas:</strong> {tooltip.tarea.horasEstimadas}h est.
                      {tooltip.tarea.horasReales ? ` / ${tooltip.tarea.horasReales}h reales` : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
