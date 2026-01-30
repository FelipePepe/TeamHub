'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Plus, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useMisRegistros,
  useResumenTimetracking,
  useCreateTimeEntry,
  useTimeEntriesSemana,
  useUpdateTimeEntry,
  useCopiarRegistros,
} from '@/hooks/use-timetracking';
import { useProyectos, useMisProyectos, type Proyecto, type Asignacion } from '@/hooks/use-proyectos';
import { usePermissions } from '@/hooks/use-permissions';
import { toast } from 'sonner';
import { format, startOfWeek, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';

// Componentes Timesheet
import { WeekNavigation } from '@/components/timetracking/week-navigation';
import { TimesheetGrid } from '@/components/timetracking/timesheet-grid';
import { CopyWeekDialog } from '@/components/timetracking/copy-week-dialog';

// Componentes Gantt
import { GanttChart } from '@/components/timetracking/gantt-chart';
import type { GanttProyecto } from '@/types/timetracking';
import { calculateProgress } from '@/lib/gantt-utils';

export default function TimetrackingPage() {
  const router = useRouter();
  const { canApproveHours } = usePermissions();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('registros');

  // Timesheet state
  const [timesheetDate, setTimesheetDate] = useState(new Date());
  const [showCopyDialog, setShowCopyDialog] = useState(false);

  // Data hooks
  const { data: misRegistrosData, isLoading, error } = useMisRegistros();
  const { data: resumen } = useResumenTimetracking();
  const createEntry = useCreateTimeEntry();
  const updateEntry = useUpdateTimeEntry();
  const { data: proyectosData } = useProyectos({});
  const { data: misProyectosData, isLoading: isLoadingMisProyectos } = useMisProyectos();
  const copiarRegistros = useCopiarRegistros();

  const proyectos = proyectosData?.data ?? [];
  const misProyectos = misProyectosData?.data ?? [];
  const registros = misRegistrosData?.data ?? [];

  // Timesheet data
  const weekStartStr = format(startOfWeek(timesheetDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const { data: semanaData, isLoading: isLoadingSemana } = useTimeEntriesSemana(weekStartStr);
  const registrosSemana = semanaData?.data ?? [];

  const handleCellChange = useCallback(
    async (proyectoId: string, fecha: string, horas: number) => {
      const existingEntry = registrosSemana.find(
        (r) => r.proyectoId === proyectoId && r.fecha.startsWith(fecha)
      );

      try {
        if (existingEntry) {
          if (horas === 0) {
            // Optionally delete - for now just set to 0
            await updateEntry.mutateAsync({ id: existingEntry.id, data: { horas: 0 } });
          } else {
            await updateEntry.mutateAsync({ id: existingEntry.id, data: { horas } });
          }
        } else if (horas > 0) {
          await createEntry.mutateAsync({
            proyectoId,
            fecha,
            horas,
            descripcion: 'Registro desde timesheet',
          });
        }
        toast.success('Horas actualizadas');
      } catch {
        toast.error('Error al actualizar horas');
      }
    },
    [registrosSemana, updateEntry, createEntry]
  );

  const handleCopyWeek = useCallback(async () => {
    const currentWeekStart = format(startOfWeek(timesheetDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const prevWeekStart = format(startOfWeek(subWeeks(timesheetDate, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd');

    try {
      const result = await copiarRegistros.mutateAsync({
        fechaOrigen: prevWeekStart,
        fechaDestino: currentWeekStart,
      });
      toast.success(result.message || `${result.copied} registros copiados`);
      setShowCopyDialog(false);
    } catch {
      toast.error('Error al copiar registros');
    }
  }, [timesheetDate, copiarRegistros]);

  // Gantt data
  const ganttProyectos = useMemo<GanttProyecto[]>(() => {
    return misProyectos
      .filter((p) => p.fechaInicio && (p.fechaFinEstimada || p.fechaFinReal))
      .map((p) => {
        const fechaInicio = new Date(p.fechaInicio!);
        const fechaFin = new Date(p.fechaFinReal || p.fechaFinEstimada!);

        return {
          id: p.id,
          nombre: p.nombre,
          codigo: p.codigo,
          fechaInicio,
          fechaFin,
          estado: p.estado,
          color: p.color,
          progreso: calculateProgress(fechaInicio, fechaFin, p.horasConsumidas, p.presupuestoHoras),
          asignaciones: [], // Se cargarían por separado si fuera necesario
        };
      });
  }, [misProyectos]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Timetracking</h1>
          <p className="text-slate-500">Registro y consulta de horas</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Registrar horas
          </Button>
          {canApproveHours && (
            <Button variant="outline" onClick={() => router.push('/timetracking/aprobacion')}>
              Pendientes de aprobación
            </Button>
          )}
        </div>
      </div>

      {resumen && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Resumen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-slate-500">Total horas</p>
                <p className="text-2xl font-semibold">{resumen.totalHoras ?? 0}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Facturables</p>
                <p className="text-2xl font-semibold">{resumen.horasFacturables ?? 0}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">No facturables</p>
                <p className="text-2xl font-semibold">{resumen.horasNoFacturables ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="registros">Mis Registros</TabsTrigger>
          <TabsTrigger value="timesheet">Timesheet Semanal</TabsTrigger>
          <TabsTrigger value="gantt">Diagrama Gantt</TabsTrigger>
        </TabsList>

        <TabsContent value="registros">
          <Card>
            <CardHeader>
              <CardTitle>Mis registros</CardTitle>
              <CardDescription>Listado de entradas de tiempo</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : error ? (
                <p className="text-sm text-red-600">Error al cargar registros</p>
              ) : registros.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="mb-4 h-12 w-12 text-slate-400" />
                  <p className="text-sm text-slate-500">No hay registros</p>
                  <Button onClick={() => setShowForm(true)} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar horas
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-slate-200">
                  {registros.slice(0, 50).map((r) => (
                    <li key={r.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">{format(new Date(r.fecha), 'd MMM yyyy', { locale: es })}</span>
                        <span className="text-slate-600">{r.horas}h</span>
                        <span className="text-sm text-slate-500 truncate max-w-[200px]">{r.descripcion}</span>
                      </div>
                      <Badge
                        variant={
                          r.estado === 'APROBADO'
                            ? 'default'
                            : r.estado === 'RECHAZADO'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {r.estado === 'APROBADO' && <CheckCircle className="mr-1 h-3 w-3" />}
                        {r.estado === 'RECHAZADO' && <XCircle className="mr-1 h-3 w-3" />}
                        {r.estado}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timesheet">
          <Card>
            <CardHeader>
              <CardTitle>Timesheet Semanal</CardTitle>
              <CardDescription>Vista de horas por proyecto y día de la semana</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <WeekNavigation
                currentDate={timesheetDate}
                onDateChange={setTimesheetDate}
                onCopyWeek={() => setShowCopyDialog(true)}
              />
              <TimesheetGrid
                currentDate={timesheetDate}
                registros={registrosSemana}
                proyectos={misProyectos}
                isLoading={isLoadingSemana}
                onCellChange={handleCellChange}
              />
            </CardContent>
          </Card>

          <CopyWeekDialog
            open={showCopyDialog}
            onOpenChange={setShowCopyDialog}
            currentDate={timesheetDate}
            onConfirm={handleCopyWeek}
            isPending={copiarRegistros.isPending}
          />
        </TabsContent>

        <TabsContent value="gantt">
          <GanttChart proyectos={ganttProyectos} isLoading={isLoadingMisProyectos} />
        </TabsContent>
      </Tabs>

      {showForm && (
        <RegistroHorasModal
          proyectos={proyectos}
          onClose={() => setShowForm(false)}
          onCreate={async (data) => {
            try {
              await createEntry.mutateAsync(data);
              toast.success('Registro creado');
              setShowForm(false);
            } catch (err: unknown) {
              const msg = err && typeof err === 'object' && 'error' in err ? (err as { error: string }).error : 'Error al crear';
              toast.error(msg);
            }
          }}
          isPending={createEntry.isPending}
        />
      )}
    </div>
  );
}

function RegistroHorasModal({
  proyectos,
  onClose,
  onCreate,
  isPending,
}: {
  proyectos: { id: string; nombre: string; codigo: string }[];
  onClose: () => void;
  onCreate: (data: {
    proyectoId: string;
    fecha: string;
    horas: number;
    descripcion: string;
    facturable?: boolean;
  }) => Promise<void>;
  isPending: boolean;
}) {
  const [proyectoId, setProyectoId] = useState('');
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [horas, setHoras] = useState(1);
  const [descripcion, setDescripcion] = useState('');
  const [facturable, setFacturable] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proyectoId || !descripcion.trim()) {
      toast.error('Proyecto y descripción son obligatorios');
      return;
    }
    if (horas < 0.01 || horas > 24) {
      toast.error('Horas deben estar entre 0.01 y 24');
      return;
    }
    await onCreate({
      proyectoId,
      fecha,
      horas,
      descripcion: descripcion.trim(),
      facturable,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Registrar horas</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
            ×
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Proyecto *</label>
              <select
                value={proyectoId}
                onChange={(e) => setProyectoId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                required
              >
                <option value="">Seleccionar</option>
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre} ({p.codigo})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha *</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Horas (0.01-24) *</label>
                <input
                  type="number"
                  min={0.01}
                  max={24}
                  step={0.25}
                  value={horas}
                  onChange={(e) => setHoras(Number(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción *</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="facturable"
                checked={facturable}
                onChange={(e) => setFacturable(e.target.checked)}
              />
              <label htmlFor="facturable" className="text-sm">Facturable</label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>Crear registro</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
