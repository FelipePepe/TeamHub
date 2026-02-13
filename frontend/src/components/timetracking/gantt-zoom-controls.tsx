'use client';

import { Button } from '@/components/ui/button';
import type { GanttZoomLevel } from '@/types/timetracking';

interface GanttZoomControlsProps {
  readonly zoom: GanttZoomLevel;
  readonly onZoomChange: (zoom: GanttZoomLevel) => void;
}

const ZOOM_OPTIONS: { value: GanttZoomLevel; label: string }[] = [
  { value: 'month', label: 'Mes' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'year', label: 'Año' },
];

export function GanttZoomControls({ zoom, onZoomChange }: GanttZoomControlsProps) {
  return (
    <div className="flex items-center gap-1">
      <span className="mr-2 text-sm text-muted-foreground">Zoom:</span>
      {ZOOM_OPTIONS.map((option) => (
        <Button
          key={option.value}
          variant={zoom === option.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onZoomChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
