'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ChartDataPoint } from '@/types/dashboard';

interface BarChartProps {
  readonly title: string;
  readonly description?: string;
  readonly data: ChartDataPoint[];
  readonly isLoading?: boolean;
  readonly height?: number;
}

const COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#a855f7',
  '#ec4899', '#06b6d4', '#f97316', '#6366f1',
];
const LOADING_BAR_KEYS = ['loading-1', 'loading-2', 'loading-3', 'loading-4'] as const;

/**
 * Renderiza un gráfico de barras con estilos accesibles y tooltips.
 * @param props - Props de título, datos, altura y estado de carga.
 * @returns Tarjeta con gráfico de barras o estados alternativos.
 */
export function BarChart({
  title,
  description,
  data,
  isLoading = false,
  height = 200,
}: BarChartProps) {
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
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const width = containerWidth - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    svg.attr('width', containerWidth).attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.id))
      .range([0, width])
      .padding(0.3);

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

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(
        d3.axisBottom(x).tickFormat((id) => {
          const item = data.find((d) => d.id === id);
          const label = item?.label ?? '';
          return label.length > 10 ? `${label.slice(0, 10)}…` : label;
        })
      )
      .call((sel) => sel.select('.domain').remove())
      .call((sel) =>
        sel
          .selectAll('text')
          .attr('fill', '#64748b')
          .attr('font-size', '11px')
          .attr('text-anchor', 'middle')
      );

    // Bars with animation
    g.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', (d) => x(d.id) ?? 0)
      .attr('width', x.bandwidth())
      .attr('y', chartHeight)
      .attr('height', 0)
      .attr('fill', (_, i) => COLORS[i % COLORS.length])
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('role', 'img')
      .attr('aria-label', (d) => `${d.label}: ${d.value}`)
      .attr('tabindex', '0')
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('opacity', 0.8);
        const rect = (event.target as SVGRectElement).getBoundingClientRect();
        const containerRect = containerRef.current!.getBoundingClientRect();
        setTooltip({
          visible: true,
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top - 8,
          label: d.label,
          value: d.value,
        });
      })
      .on('mouseleave', function () {
        d3.select(this).attr('opacity', 1);
        setTooltip((prev) => ({ ...prev, visible: false }));
      })
      .on('focus', function (event, d) {
        d3.select(this).attr('opacity', 0.8);
        const rect = (event.target as SVGRectElement).getBoundingClientRect();
        const containerRect = containerRef.current!.getBoundingClientRect();
        setTooltip({
          visible: true,
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top - 8,
          label: d.label,
          value: d.value,
        });
      })
      .on('blur', function () {
        d3.select(this).attr('opacity', 1);
        setTooltip((prev) => ({ ...prev, visible: false }));
      })
      .transition()
      .duration(600)
      .ease(d3.easeCubicOut)
      .attr('y', (d) => y(d.value))
      .attr('height', (d) => chartHeight - y(d.value));

    // Value labels above bars
    g.selectAll('.value-label')
      .data(data)
      .join('text')
      .attr('class', 'value-label')
      .attr('x', (d) => (x(d.id) ?? 0) + x.bandwidth() / 2)
      .attr('y', (d) => y(d.value) - 6)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('opacity', 0)
      .text((d) => d.value)
      .transition()
      .duration(600)
      .delay(300)
      .attr('opacity', 1);
  }, [data, height]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2" style={{ height }}>
            {LOADING_BAR_KEYS.map((key) => (
              <Skeleton key={key} className="flex-1" style={{ height: `${Math.random() * 60 + 20}%` }} />
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
        <div ref={containerRef} className="relative" role="img" aria-label={`Gráfico de barras: ${title}`}>
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
