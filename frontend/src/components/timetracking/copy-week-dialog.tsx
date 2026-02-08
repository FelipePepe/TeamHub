'use client';

import { format, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Copy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CopyWeekDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDate: Date;
  onConfirm: () => void;
  isPending: boolean;
}

export function CopyWeekDialog({
  open,
  onOpenChange,
  currentDate,
  onConfirm,
  isPending,
}: CopyWeekDialogProps) {
  const previousWeek = subWeeks(currentDate, 1);
  const prevWeekStart = startOfWeek(previousWeek, { weekStartsOn: 1 });
  const prevWeekEnd = endOfWeek(previousWeek, { weekStartsOn: 1 });

  const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Copiar semana anterior
          </DialogTitle>
          <DialogDescription>
            Esta acción copiará todos los registros de la semana anterior a la semana actual.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-border p-4">
            <div className="mb-2 text-sm font-medium text-muted-foreground">Desde</div>
            <div className="text-sm">
              {format(prevWeekStart, "d MMM", { locale: es })} - {format(prevWeekEnd, "d MMM yyyy", { locale: es })}
            </div>
          </div>

          <div className="flex justify-center">
            <span className="text-muted-foreground">↓</span>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 p-4">
            <div className="mb-2 text-sm font-medium text-blue-600 dark:text-blue-400">Hacia</div>
            <div className="text-sm">
              {format(currentWeekStart, "d MMM", { locale: es })} - {format(currentWeekEnd, "d MMM yyyy", { locale: es })}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Copiando...' : 'Confirmar copia'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
