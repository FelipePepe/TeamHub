'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isThisWeek } from 'date-fns';
import { es } from 'date-fns/locale';

interface WeekNavigationProps {
  readonly currentDate: Date;
  readonly onDateChange: (date: Date) => void;
  readonly onCopyWeek?: () => void;
}

export function WeekNavigation({ currentDate, onDateChange, onCopyWeek }: WeekNavigationProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const handlePrevWeek = () => {
    onDateChange(subWeeks(currentDate, 1));
  };

  const handleNextWeek = () => {
    onDateChange(addWeeks(currentDate, 1));
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const isCurrentWeek = isThisWeek(currentDate, { weekStartsOn: 1 });

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handlePrevWeek} aria-label="Semana anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[200px] text-center font-medium">
          {format(weekStart, "d MMM", { locale: es })} - {format(weekEnd, "d MMM yyyy", { locale: es })}
        </span>
        <Button variant="outline" size="icon" onClick={handleNextWeek} aria-label="Semana siguiente">
          <ChevronRight className="h-4 w-4" />
        </Button>
        {!isCurrentWeek && (
          <Button variant="ghost" size="sm" onClick={handleToday}>
            Hoy
          </Button>
        )}
      </div>
      {onCopyWeek && (
        <Button variant="outline" size="sm" onClick={onCopyWeek}>
          Copiar semana anterior
        </Button>
      )}
    </div>
  );
}
