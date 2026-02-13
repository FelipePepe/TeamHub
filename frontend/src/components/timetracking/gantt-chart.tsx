'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { GanttZoomControls } from './gantt-zoom-controls';
import { GanttTooltip } from './gantt-tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ESTADO_COLORS,
  ESTADO_LABELS,
  type GanttZoomLevel,
  type GanttProyecto,
} from '@/types/timetracking';
import {
  getDateRange,
  createTimeScale,
  getHeaderIntervals,
  calculateBarPosition,
  DEFAULT_GANTT_CONFIG,
} from '@/lib/gantt-utils';
import type { ProyectoEstado } from '@/hooks/use-proyectos';

interface GanttChartProps {
  readonly proyectos: GanttProyecto[];
  readonly isLoading: boolean;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  proyecto: GanttProyecto | null;
}

const LOADING_PROJECT_ROW_KEYS = ['loading-1', 'loading-2', 'loading-3', 'loading-4', 'loading-5'] as const;

export function GanttChart({ proyectos, isLoading }: GanttChartProps) {
  const [zoom, setZoom] = useState<GanttZoomLevel>('quarter');
  const [chartWidth, setChartWidth] = useState(800);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    proyecto: null,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const config = { ...DEFAULT_GANTT_CONFIG, zoom };
  const { start, end } = getDateRange(zoom);
  config.startDate = start;
  config.endDate = end;

  const labelWidth = 180;

  // Responsive width based on container
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setChartWidth(Math.max(width, 600)); // Mínimo 600px
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const timeScale = useMemo(
    () => createTimeScale(config.startDate, config.endDate, chartWidth - labelWidth),
    [config.startDate, config.endDate, chartWidth]
  );

  const headerIntervals = useMemo(
    () => getHeaderIntervals(config.startDate, config.endDate, zoom),
    [config.startDate, config.endDate, zoom]
  );

  const handleMouseEnter = (
    e: React.MouseEvent,
    proyecto: GanttProyecto
  ) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltip({
        visible: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        proyecto,
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

  const totalHeight =
    config.headerHeight + proyectos.length * config.rowHeight + config.padding * 2;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Diagrama Gantt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            {LOADING_PROJECT_ROW_KEYS.map((key) => (
              <Skeleton key={key} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Diagrama Gantt</CardTitle>
        <GanttZoomControls zoom={zoom} onZoomChange={setZoom} />
      </CardHeader>
      <CardContent>
        {proyectos.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-slate-500">
            No hay proyectos con fechas definidas
          </div>
        ) : (
          <div
            ref={containerRef}
            className="relative w-full overflow-x-auto"
            onMouseMove={handleMouseMove}
          >
            <svg
              width={chartWidth}
              height={totalHeight}
              className="min-w-full"
            >
                  {/* Background grid */}
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
                          className="stroke-slate-200 dark:stroke-slate-700"
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
                      className="fill-slate-50 dark:fill-slate-800"
                    />
                    <line
                      x1={0}
                      y1={config.headerHeight}
                      x2={chartWidth}
                      y2={config.headerHeight}
                      className="stroke-slate-200 dark:stroke-slate-700"
                      strokeWidth={1}
                    />
                    {/* Label column header */}
                    <text
                      x={config.padding}
                      y={config.headerHeight / 2}
                      dominantBaseline="middle"
                      className="fill-slate-700 dark:fill-slate-200 text-sm font-medium"
                    >
                      Proyecto
                    </text>
                    {/* Time intervals */}
                    {headerIntervals.map((interval) => {
                      const x = timeScale(interval.date) + labelWidth;
                      return (
                        <text
                          key={`header-${interval.date.toISOString()}-${interval.label}`}
                          x={x + 4}
                          y={config.headerHeight / 2}
                          dominantBaseline="middle"
                          className="fill-slate-600 dark:fill-slate-400 text-xs"
                        >
                          {interval.label}
                        </text>
                      );
                    })}
                  </g>

                  {/* Today line */}
                  <g>
                    {(() => {
                      const todayX = timeScale(new Date()) + labelWidth;
                      if (todayX >= labelWidth && todayX <= chartWidth) {
                        return (
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
                        );
                      }
                      return null;
                    })()}
                  </g>

                  {/* Project rows */}
                  {proyectos.map((proyecto, rowIndex) => {
                    const y = config.headerHeight + rowIndex * config.rowHeight;
                    const barY = y + (config.rowHeight - config.barHeight) / 2;
                    const bar = calculateBarPosition(
                      proyecto.fechaInicio,
                      proyecto.fechaFin,
                      timeScale
                    );

                    return (
                      <g key={proyecto.id}>
                        {/* Row background */}
                        <rect
                          x={0}
                          y={y}
                          width={chartWidth}
                          height={config.rowHeight}
                          className={rowIndex % 2 === 0 ? 'fill-white dark:fill-slate-900' : 'fill-slate-50 dark:fill-slate-900/50'}
                        />
                        <line
                          x1={0}
                          y1={y + config.rowHeight}
                          x2={chartWidth}
                          y2={y + config.rowHeight}
                          className="stroke-slate-200 dark:stroke-slate-700"
                          strokeWidth={1}
                        />

                        {/* Project label */}
                        <g>
                          <text
                            x={config.padding}
                            y={y + config.rowHeight / 2 - 6}
                            className="fill-slate-900 dark:fill-slate-100 text-sm font-medium"
                          >
                            {proyecto.nombre.length > 20
                              ? proyecto.nombre.slice(0, 20) + '...'
                              : proyecto.nombre}
                          </text>
                          <text
                            x={config.padding}
                            y={y + config.rowHeight / 2 + 10}
                            className="fill-slate-500 dark:fill-slate-400 text-xs"
                          >
                            {proyecto.codigo}
                          </text>
                        </g>

                        {/* Project bar */}
                        {bar.visible && (
                          <g
                            onMouseEnter={(e) => handleMouseEnter(e, proyecto)}
                            onMouseLeave={handleMouseLeave}
                            style={{ cursor: 'pointer' }}
                          >
                            {/* Background bar */}
                            <rect
                              x={bar.x + labelWidth}
                              y={barY}
                              width={bar.width}
                              height={config.barHeight}
                              rx={4}
                              fill={ESTADO_COLORS[proyecto.estado]}
                              opacity={0.3}
                            />
                            {/* Progress bar */}
                            <rect
                              x={bar.x + labelWidth}
                              y={barY}
                              width={(bar.width * proyecto.progreso) / 100}
                              height={config.barHeight}
                              rx={4}
                              fill={ESTADO_COLORS[proyecto.estado]}
                            />
                            {/* Progress text */}
                            {bar.width > 50 && (
                              <text
                                x={bar.x + labelWidth + bar.width / 2}
                                y={barY + config.barHeight / 2}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="fill-white text-xs font-medium"
                                style={{ pointerEvents: 'none' }}
                              >
                                {proyecto.progreso}%
                              </text>
                            )}
                          </g>
                        )}

                        {/* Asignaciones (sub-bars) */}
                        {proyecto.asignaciones.map((asig, asigIndex) => {
                          const asigBar = calculateBarPosition(
                            asig.fechaInicio,
                            asig.fechaFin,
                            timeScale
                          );
                          if (!asigBar.visible) return null;

                          const asigY = barY + config.barHeight + 4 + asigIndex * 14;
                          return (
                            <g key={asig.id}>
                              <rect
                                x={asigBar.x + labelWidth}
                                y={asigY}
                                width={asigBar.width}
                                height={10}
                                rx={2}
                                fill={ESTADO_COLORS[proyecto.estado]}
                                opacity={0.6}
                              />
                              {asigBar.width > 60 && (
                                <text
                                  x={asigBar.x + labelWidth + 4}
                                  y={asigY + 7}
                                  className="fill-white text-[9px]"
                                  style={{ pointerEvents: 'none' }}
                                >
                                  {asig.usuarioNombre}
                                </text>
                              )}
                            </g>
                          );
                        })}
                      </g>
                    );
                  })}
                </svg>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                  {(Object.keys(ESTADO_COLORS) as ProyectoEstado[]).map((estado) => (
                    <div key={estado} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-sm"
                        style={{ backgroundColor: ESTADO_COLORS[estado] }}
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-400">{ESTADO_LABELS[estado]}</span>
                    </div>
                  ))}
                </div>

                {/* Tooltip */}
                {tooltip.proyecto && (
                  <GanttTooltip
                    nombre={tooltip.proyecto.nombre}
                    codigo={tooltip.proyecto.codigo}
                    estado={tooltip.proyecto.estado}
                    fechaInicio={tooltip.proyecto.fechaInicio}
                    fechaFin={tooltip.proyecto.fechaFin}
                    progreso={tooltip.proyecto.progreso}
                    position={{ x: tooltip.x, y: tooltip.y }}
                    visible={tooltip.visible}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
  );
}
