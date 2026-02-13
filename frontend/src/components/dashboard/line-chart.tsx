'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { TimeSeriesPoint } from '@/types/dashboard';

interface LineChartProps {
  readonly title: string;
  readonly description?: string;
  readonly data: TimeSeriesPoint[];
  readonly isLoading?: boolean;
  readonly height?: number;
  readonly formatLabel?: (fecha: string) => string;
}

/**
 * Formatea una fecha ISO para etiquetas cortas de ejes.
 * @param fecha - Fecha ISO en string.
 * @returns Etiqueta breve en español (día/mes).
 */
const defaultFormatLabel = (fecha: string) => {
  const date = new Date(fecha);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
};

/**
 * Renderiza un gráfico de línea con estilos accesibles y tooltips.
 * @param props - Props de título, datos, altura y formateador de etiquetas.
 * @returns Tarjeta con gráfico de línea o estados alternativos.
 */
export function LineChart({
  title,
  description,
  data,
  isLoading = false,
  height = 200,
  formatLabel = defaultFormatLabel,
}: LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    label: string;
    value: number;
  }>({ visible: false, x: 0, y: 0, label: '', value: 0 });

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = containerWidth - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    svg.attr('width', containerWidth).attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3
      .scalePoint()
      .domain(data.map((d) => d.fecha))
      .range([0, width])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value) ?? 1])
      .nice()
      .range([chartHeight, 0]);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(y)
          .ticks(4)
          .tickSize(-width)
          .tickFormat(() => '')
      )
      .call((sel) => sel.select('.domain').remove())
      .call((sel) =>
        sel.selectAll('line').attr('stroke', '#e2e8f0').attr('stroke-dasharray', '2,2')
      );

    // Y axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(4))
      .call((sel) => sel.select('.domain').remove())
      .call((sel) =>
        sel
          .selectAll('text')
          .attr('fill', '#64748b')
          .attr('font-size', '11px')
      );

    // X axis (show only first, middle, last)
    const tickValues = data.length <= 3
      ? data.map((d) => d.fecha)
      : [data[0].fecha, data[Math.floor(data.length / 2)].fecha, data[data.length - 1].fecha];

    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues(tickValues)
          .tickFormat((d) => formatLabel(d as string))
      )
      .call((sel) => sel.select('.domain').remove())
      .call((sel) =>
        sel
          .selectAll('text')
          .attr('fill', '#64748b')
          .attr('font-size', '11px')
      );

    // Gradient definition
    const gradientId = `line-gradient-${Math.random().toString(36).slice(2, 8)}`;
    const defs = svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#3b82f6').attr('stop-opacity', 0.3);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#3b82f6').attr('stop-opacity', 0);

    // Line generator
    const line = d3
      .line<TimeSeriesPoint>()
      .x((d) => x(d.fecha) ?? 0)
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    // Area generator
    const area = d3
      .area<TimeSeriesPoint>()
      .x((d) => x(d.fecha) ?? 0)
      .y0(chartHeight)
      .y1((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    // Area fill
    g.append('path')
      .datum(data)
      .attr('fill', `url(#${gradientId})`)
      .attr('d', area);

    // Line path with animation
    const path = g
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2.5)
      .attr('d', line);

    const totalLength = (path.node() as SVGPathElement)?.getTotalLength() ?? 0;
    path
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(800)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    // Data points (circles)
    g.selectAll('.data-point')
      .data(data)
      .join('circle')
      .attr('class', 'data-point')
      .attr('cx', (d) => x(d.fecha) ?? 0)
      .attr('cy', (d) => y(d.value))
      .attr('r', 4)
      .attr('fill', '#3b82f6')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('role', 'img')
      .attr('aria-label', (d) => `${formatLabel(d.fecha)}: ${d.value}`)
      .attr('tabindex', '0')
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).transition().duration(150).attr('r', 7);
        const rect = (event.target as SVGCircleElement).getBoundingClientRect();
        const containerRect = containerRef.current!.getBoundingClientRect();
        setTooltip({
          visible: true,
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top - 8,
          label: formatLabel(d.fecha),
          value: d.value,
        });
      })
      .on('mouseleave', function () {
        d3.select(this).transition().duration(150).attr('r', 4);
        setTooltip((prev) => ({ ...prev, visible: false }));
      })
      .on('focus', function (event, d) {
        d3.select(this).transition().duration(150).attr('r', 7);
        const rect = (event.target as SVGCircleElement).getBoundingClientRect();
        const containerRect = containerRef.current!.getBoundingClientRect();
        setTooltip({
          visible: true,
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top - 8,
          label: formatLabel(d.fecha),
          value: d.value,
        });
      })
      .on('blur', function () {
        d3.select(this).transition().duration(150).attr('r', 4);
        setTooltip((prev) => ({ ...prev, visible: false }));
      });
  }, [data, height, formatLabel]);

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
        <div className="flex items-center justify-center text-muted-foreground" style={{ height }}>
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
        <div ref={containerRef} className="relative" role="img" aria-label={`Gráfico de línea: ${title}`}>
          <svg ref={svgRef} className="w-full" />
          {tooltip.visible && (
            <div
              className="absolute pointer-events-none z-10 rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white shadow-lg -translate-x-1/2 -translate-y-full"
              style={{ left: tooltip.x, top: tooltip.y }}
              role="tooltip"
            >
              <div className="font-medium">{tooltip.label}</div>
              <div className="text-slate-300">{tooltip.value}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
