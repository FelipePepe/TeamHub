'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Plus, CheckCircle, XCircle, Briefcase, DollarSign, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useTimeEntries,
  useResumenTimetracking,
  useCreateTimeEntry,
  useTimeEntriesSemana,
  useUpdateTimeEntry,
  useDeleteTimeEntry,
  useCopiarRegistros,
} from '@/hooks/use-timetracking';
import { useProyectos, useMisProyectos, useAsignaciones } from '@/hooks/use-proyectos';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuth } from '@/hooks/use-auth';
import { useEmpleados, useEmpleadosByManager } from '@/hooks/use-empleados';
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

const PROYECTO_PLACEHOLDER_VALUE = '__seleccionar__';
const LOADING_REGISTROS_KEYS = ['loading-1', 'loading-2', 'loading-3', 'loading-4', 'loading-5'] as const;

/** Color de fondo/texto del pill de horas según el total de horas del registro. */
function getHorasColor(horas: number): string {
  if (horas >= 8) return 'bg-blue-500/15 text-blue-400';
  if (horas >= 4) return 'bg-indigo-500/15 text-indigo-400';
  return 'bg-slate-500/15 text-slate-400';
}

/** Estilos del indicador de estado. */
const ESTADO_STYLES: Record<string, { dot: string; text: string; bg: string }> = {
  APROBADO:  { dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  RECHAZADO: { dot: 'bg-red-400',     text: 'text-red-400',     bg: 'bg-red-400/10'     },
  PENDIENTE: { dot: 'bg-amber-400',   text: 'text-amber-400',   bg: 'bg-amber-400/10'   },
};

function getEstadoStyle(estado: string) {
  return ESTADO_STYLES[estado] ?? { dot: 'bg-slate-400', text: 'text-slate-400', bg: 'bg-slate-400/10' };
}

/**
 * Extrae un mensaje de error de API sin type assertions.
 */
function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'error' in error) {
    const maybeError = error.error;
    if (typeof maybeError === 'string' && maybeError.length > 0) {
      return maybeError;
    }
  }

  return fallback;
}

export default function TimetrackingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { canApproveHours, canViewOthersHours, canWriteOthersHours, isManager } = usePermissions();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('registros');

  // Timesheet state
  const [timesheetDate, setTimesheetDate] = useState(new Date());
  const [showCopyDialog, setShowCopyDialog] = useState(false);

  // User selector state (for privileged roles)
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  /** Filtro de proyecto del timesheet semanal. */
  const [selectedTimesheetProyectoId, setSelectedTimesheetProyectoId] = useState<string | undefined>(undefined);
  /** Filtro de la pestaña Registros: '__todos__' = sin filtro de usuario. */
  const [registrosFilterUserId, setRegistrosFilterUserId] = useState<string>('__todos__');
  /** Filtro de proyecto de la pestaña Registros. */
  const [registrosFilterProyectoId, setRegistrosFilterProyectoId] = useState<string>('__todos__');

  // Data hooks
  const registrosFilter: Record<string, string> | undefined =
    (canViewOthersHours && registrosFilterUserId !== '__todos__') || registrosFilterProyectoId !== '__todos__'
      ? {
          ...(canViewOthersHours && registrosFilterUserId !== '__todos__' ? { usuarioId: registrosFilterUserId } : {}),
          ...(registrosFilterProyectoId === '__todos__' ? {} : { proyectoId: registrosFilterProyectoId }),
        }
      : undefined;
  const { data: registrosData, isLoading, error } = useTimeEntries(registrosFilter);
  const { data: resumen } = useResumenTimetracking();
  const createEntry = useCreateTimeEntry();
  const updateEntry = useUpdateTimeEntry();
  const deleteEntry = useDeleteTimeEntry();
  const [deletingEntry, setDeletingEntry] = useState<{ id: string; descripcion: string; fecha: string } | null>(null);
  const { data: proyectosData } = useProyectos({});
  const { data: misProyectosData, isLoading: isLoadingMisProyectos } = useMisProyectos();
  const copiarRegistros = useCopiarRegistros();

  const proyectos = proyectosData?.data ?? [];
  const misProyectos = useMemo(() => misProyectosData?.data ?? [], [misProyectosData]);
  const registros = registrosData?.data ?? [];

  /** Mapa proyectoId → nombre para los registros del listado. */
  const proyectoNombreMap = useMemo(
    () => new Map(proyectos.map((p) => [p.id, p.nombre])),
    [proyectos]
  );

  /** Proyectos del usuario que han superado su presupuesto de horas. */
  const proyectosSobrePresupuesto = useMemo(() => {
    const base = canViewOthersHours ? proyectos : misProyectos;
    return base.filter(
      (p) => (p.presupuestoHoras ?? 0) > 0 && (p.horasConsumidas ?? 0) > (p.presupuestoHoras ?? 0)
    );
  }, [canViewOthersHours, proyectos, misProyectos]);

  /** Proyecto actualmente seleccionado en el filtro de Registros. */
  const selectedProyectoRegistros = useMemo(
    () => (canViewOthersHours ? proyectos : misProyectos).find((p) => p.id === registrosFilterProyectoId),
    [canViewOthersHours, proyectos, misProyectos, registrosFilterProyectoId]
  );

  /** Proyecto actualmente seleccionado en el Timesheet Semanal. */
  const selectedProyectoTimesheet = useMemo(
    () => [...proyectos, ...misProyectos].find((p) => p.id === selectedTimesheetProyectoId),
    [proyectos, misProyectos, selectedTimesheetProyectoId]
  );

  // Employee lists for user selector
  const canFetchAll = canViewOthersHours && !isManager;
  const { data: todosEmpleadosData } = useEmpleados({ activo: true }, canFetchAll);
  const { data: equipoData } = useEmpleadosByManager(
    user?.id ?? '',
    isManager
  );
  const empleadosBase = isManager
    ? (equipoData ?? [])
    : (todosEmpleadosData?.data ?? []);

  // Fetch asignaciones for the selected timesheet project to filter employee selector
  const { data: asignacionesProyectoData } = useAsignaciones(
    selectedTimesheetProyectoId ?? '',
    canViewOthersHours && !!selectedTimesheetProyectoId
  );
  const empleadosParaSelector = useMemo(() => {
    if (!canViewOthersHours) return [];
    if (!selectedTimesheetProyectoId || !asignacionesProyectoData?.data) return empleadosBase;
    const usuarioIdsEnProyecto = new Set(asignacionesProyectoData.data.map((a) => a.usuarioId));
    return empleadosBase.filter((emp) => usuarioIdsEnProyecto.has(emp.id));
  }, [canViewOthersHours, selectedTimesheetProyectoId, asignacionesProyectoData, empleadosBase]);

  /** Mapa usuarioId → rol para mostrar el rol en el selector de empleado cuando hay proyecto seleccionado. */
  const rolPorUsuarioId = useMemo(() => {
    if (!asignacionesProyectoData?.data) return new Map<string, string>();
    return new Map(
      asignacionesProyectoData.data
        .filter((a) => a.rol)
        .map((a) => [a.usuarioId, a.rol as string])
    );
  }, [asignacionesProyectoData]);

  // Fetch asignaciones for the Registros tab project filter
  const registrosProyectoActivo = registrosFilterProyectoId === '__todos__' ? '' : registrosFilterProyectoId;
  const { data: asignacionesRegistrosData } = useAsignaciones(
    registrosProyectoActivo,
    canViewOthersHours && !!registrosProyectoActivo
  );
  const empleadosParaRegistros = useMemo(() => {
    if (!canViewOthersHours) return [];
    if (!registrosProyectoActivo || !asignacionesRegistrosData?.data) return empleadosBase;
    const ids = new Set(asignacionesRegistrosData.data.map((a) => a.usuarioId));
    return empleadosBase.filter((emp) => ids.has(emp.id));
  }, [canViewOthersHours, registrosProyectoActivo, asignacionesRegistrosData, empleadosBase]);

  const rolPorUsuarioIdRegistros = useMemo(() => {
    if (!asignacionesRegistrosData?.data) return new Map<string, string>();
    return new Map(
      asignacionesRegistrosData.data
        .filter((a) => a.rol)
        .map((a) => [a.usuarioId, a.rol as string])
    );
  }, [asignacionesRegistrosData]);

  // Timesheet data
  const weekStartStr = format(startOfWeek(timesheetDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const { data: semanaData, isLoading: isLoadingSemana } = useTimeEntriesSemana(weekStartStr, selectedUserId);
  const registrosSemana = useMemo(() => semanaData?.data ?? [], [semanaData]);

  /** Proyectos y registros filtrados según el selector de proyecto del timesheet. */
  const proyectosTimesheetFiltrados = useMemo(
    () => selectedTimesheetProyectoId
      ? proyectos.filter((p) => p.id === selectedTimesheetProyectoId)
      : proyectos,
    [proyectos, selectedTimesheetProyectoId]
  );
  const registrosSemanaFiltrados = useMemo(
    () => selectedTimesheetProyectoId
      ? registrosSemana.filter((r) => r.proyectoId === selectedTimesheetProyectoId)
      : registrosSemana,
    [registrosSemana, selectedTimesheetProyectoId]
  );

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
            // Pass usuarioId if a different user is selected (privileged roles only)
            ...(canWriteOthersHours && selectedUserId ? { usuarioId: selectedUserId } : {}),
          });
        }
        toast.success('Horas actualizadas');
      } catch {
        toast.error('Error al actualizar horas');
      }
    },
    [registrosSemana, updateEntry, createEntry, selectedUserId, canWriteOthersHours]
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

  let registrosContent: React.ReactNode;
  if (isLoading) {
    registrosContent = (
      <div className="space-y-2">
        {LOADING_REGISTROS_KEYS.map((key) => (
          <Skeleton key={key} className="h-12" />
        ))}
      </div>
    );
  } else if (error) {
    registrosContent = <p className="text-sm text-red-600">Error al cargar registros</p>;
  } else if (registros.length === 0) {
    registrosContent = (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No hay registros</p>
        <Button onClick={() => setShowForm(true)} className="mt-4">
          <Plus className="mr-2 h-4 w-4" />
          Registrar horas
        </Button>
      </div>
    );
  } else {
    registrosContent = (
      <div className="divide-y divide-border">
        {registros.slice(0, 50).map((r) => {
          const estadoStyle = getEstadoStyle(r.estado);
          const proyectoNombre = proyectoNombreMap.get(r.proyectoId);
          const horas = Number(r.horas ?? 0);
          return (
            <div
              key={r.id}
              className="group flex items-center gap-4 px-1 py-3.5 hover:bg-muted/40 transition-colors"
            >
              {/* Estado — barra lateral de color */}
              <div className={`h-8 w-1 rounded-full flex-shrink-0 ${estadoStyle.dot}`} />

              {/* Fecha */}
              <div className="w-28 flex-shrink-0">
                <span className="text-sm font-semibold text-foreground">
                  {format(new Date(r.fecha), 'd MMM yyyy', { locale: es })}
                </span>
              </div>

              {/* Horas */}
              <div className={`flex-shrink-0 rounded-md px-2.5 py-0.5 text-sm font-bold tabular-nums ${getHorasColor(horas)}`}>
                {horas % 1 === 0 ? horas : horas.toFixed(1)}h
              </div>

              {/* Proyecto */}
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {proyectoNombre && (
                  <div className="flex flex-shrink-0 items-center gap-1 rounded-md bg-muted px-2 py-0.5">
                    <Briefcase className="h-3 w-3 text-muted-foreground" />
                    <span className="max-w-[160px] truncate text-xs font-medium text-muted-foreground">
                      {proyectoNombre}
                    </span>
                  </div>
                )}
                <span className="truncate text-sm text-muted-foreground">{r.descripcion}</span>
              </div>

              {/* Empleado (solo roles privilegiados) */}
              {canViewOthersHours && r.usuarioNombre && (
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {r.usuarioNombre.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden text-sm font-medium text-foreground uppercase sm:inline">{r.usuarioNombre}</span>
                </div>
              )}

              {/* Facturable */}
              {r.facturable && (
                <div className="flex-shrink-0" title="Facturable">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                </div>
              )}

              {/* Estado badge */}
              <div className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${estadoStyle.bg} ${estadoStyle.text}`}>
                {r.estado === 'APROBADO'  && <CheckCircle className="h-3 w-3" />}
                {r.estado === 'RECHAZADO' && <XCircle     className="h-3 w-3" />}
                {r.estado}
              </div>

              {/* Eliminar */}
              {(canWriteOthersHours || (r.usuarioId === user?.id && r.estado === 'PENDIENTE')) && (
                <button
                  type="button"
                  title="Eliminar registro"
                  onClick={() => setDeletingEntry({ id: r.id, descripcion: r.descripcion ?? '', fecha: r.fecha })}
                  className="flex-shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/15 hover:text-destructive text-muted-foreground"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Timetracking</h1>
          <p className="text-muted-foreground">Registro y consulta de horas</p>
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
                <p className="text-sm text-muted-foreground">Total horas</p>
                <p className="text-2xl font-semibold">{Number(resumen.totalHoras ?? 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Facturables</p>
                <p className="text-2xl font-semibold">{Number(resumen.horasFacturables ?? 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">No facturables</p>
                <p className="text-2xl font-semibold">{Number(resumen.horasNoFacturables ?? 0).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Banner global: proyectos con horas consumidas > presupuesto */}
      {proyectosSobrePresupuesto.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-semibold">
              {proyectosSobrePresupuesto.length === 1
                ? '1 proyecto ha superado su presupuesto de horas'
                : `${proyectosSobrePresupuesto.length} proyectos han superado su presupuesto de horas`}
            </span>
          </div>
          <ul className="ml-6 space-y-0.5">
            {proyectosSobrePresupuesto.map((p) => (
              <li key={p.id} className="text-xs text-amber-300">
                <span className="font-medium">{p.nombre}</span>{' — '}
                {(p.horasConsumidas ?? 0).toFixed(1)}h consumidas de {(p.presupuestoHoras ?? 0).toFixed(1)}h
                {' '}(<span className="font-semibold">+{((p.horasConsumidas ?? 0) - (p.presupuestoHoras ?? 0)).toFixed(1)}h</span>)
              </li>
            ))}
          </ul>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="registros">{canViewOthersHours ? 'Registros' : 'Mis Registros'}</TabsTrigger>
          <TabsTrigger value="timesheet">Timesheet Semanal</TabsTrigger>
          <TabsTrigger value="gantt">Diagrama Gantt</TabsTrigger>
        </TabsList>

        <TabsContent value="registros">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>{canViewOthersHours ? 'Registros' : 'Mis registros'}</CardTitle>
                  <CardDescription>Listado de entradas de tiempo</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Filtro por proyecto */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Proyecto:</span>
                    <Select
                      value={registrosFilterProyectoId}
                      onValueChange={(v) => {
                        setRegistrosFilterProyectoId(v);
                        setRegistrosFilterUserId('__todos__'); // reset empleado al cambiar proyecto
                      }}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__todos__">Todos</SelectItem>
                        {(canViewOthersHours ? proyectos : misProyectos).map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Filtro por empleado (solo roles privilegiados) */}
                  {canViewOthersHours && empleadosParaRegistros.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Empleado:</span>
                      <Select
                        value={registrosFilterUserId}
                        onValueChange={setRegistrosFilterUserId}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__todos__">Todos</SelectItem>
                          {empleadosParaRegistros.map((emp) => (
                            <SelectItem
                              key={emp.id}
                              value={emp.id}
                              textValue={`${emp.nombre} ${emp.apellidos}`}
                            >
                              <span className="uppercase">{emp.nombre} {emp.apellidos}</span>
                              {registrosProyectoActivo && rolPorUsuarioIdRegistros.get(emp.id) && (
                                <span className="ml-1.5 text-xs text-muted-foreground">({rolPorUsuarioIdRegistros.get(emp.id)})</span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Alerta inline cuando el proyecto seleccionado excede presupuesto */}
              {selectedProyectoRegistros &&
                (selectedProyectoRegistros.presupuestoHoras ?? 0) > 0 &&
                (selectedProyectoRegistros.horasConsumidas ?? 0) > (selectedProyectoRegistros.presupuestoHoras ?? 0) && (
                <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-400">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p className="text-sm">
                    <span className="font-semibold">{selectedProyectoRegistros.nombre}</span> ha superado su presupuesto:{' '}
                    <span className="font-semibold">{(selectedProyectoRegistros.horasConsumidas ?? 0).toFixed(1)}h</span>
                    {' '}de{' '}
                    <span className="font-semibold">{(selectedProyectoRegistros.presupuestoHoras ?? 0).toFixed(1)}h</span>
                    {' '}presupuestadas{' '}(<span className="font-semibold">+{((selectedProyectoRegistros.horasConsumidas ?? 0) - (selectedProyectoRegistros.presupuestoHoras ?? 0)).toFixed(1)}h</span>).
                  </p>
                </div>
              )}
              {registrosContent}
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
              <div className="flex flex-wrap items-center gap-4">
                {canViewOthersHours && empleadosParaSelector.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Empleado:</span>
                    <Select
                      value={selectedUserId ?? '__propio__'}
                      onValueChange={(v) => setSelectedUserId(v === '__propio__' ? undefined : v)}
                    >
                      <SelectTrigger className="w-56">
                        <SelectValue placeholder="Mis horas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__propio__">Mis horas</SelectItem>
                        {empleadosParaSelector.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            <span className="uppercase">{emp.nombre} {emp.apellidos}</span>
                            {selectedTimesheetProyectoId && rolPorUsuarioId.get(emp.id) && (
                              <span className="ml-1.5 text-xs text-muted-foreground">({rolPorUsuarioId.get(emp.id)})</span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Proyecto:</span>
                  <Select
                    value={selectedTimesheetProyectoId ?? '__todos__'}
                    onValueChange={(v) => {
                      setSelectedTimesheetProyectoId(v === '__todos__' ? undefined : v);
                      setSelectedUserId(undefined); // reset empleado al cambiar proyecto
                    }}
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Todos los proyectos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__todos__">Todos los proyectos</SelectItem>
                      {proyectos.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre} ({p.codigo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Alerta inline cuando el proyecto del timesheet excede presupuesto */}
              {selectedProyectoTimesheet &&
                (selectedProyectoTimesheet.presupuestoHoras ?? 0) > 0 &&
                (selectedProyectoTimesheet.horasConsumidas ?? 0) > (selectedProyectoTimesheet.presupuestoHoras ?? 0) && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-400">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p className="text-sm">
                    <span className="font-semibold">{selectedProyectoTimesheet.nombre}</span> ha superado su presupuesto:{' '}
                    <span className="font-semibold">{(selectedProyectoTimesheet.horasConsumidas ?? 0).toFixed(1)}h</span>
                    {' '}de{' '}
                    <span className="font-semibold">{(selectedProyectoTimesheet.presupuestoHoras ?? 0).toFixed(1)}h</span>
                    {' '}presupuestadas{' '}(<span className="font-semibold">+{((selectedProyectoTimesheet.horasConsumidas ?? 0) - (selectedProyectoTimesheet.presupuestoHoras ?? 0)).toFixed(1)}h</span>).
                  </p>
                </div>
              )}
              <WeekNavigation
                currentDate={timesheetDate}
                onDateChange={setTimesheetDate}
                onCopyWeek={() => setShowCopyDialog(true)}
              />
              <TimesheetGrid
                currentDate={timesheetDate}
                registros={registrosSemanaFiltrados}
                proyectos={proyectosTimesheetFiltrados}
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
              const msg = getApiErrorMessage(err, 'Error al crear');
              toast.error(msg);
            }
          }}
          isPending={createEntry.isPending}
          canWriteOthersHours={canWriteOthersHours}
          empleados={empleadosParaSelector}
        />
      )}

      {/* Diálogo de confirmación para eliminar un registro */}
      <Dialog open={!!deletingEntry} onOpenChange={(open) => { if (!open) setDeletingEntry(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar registro?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se eliminará el registro del{' '}
            <span className="font-medium text-foreground">
              {deletingEntry ? format(new Date(deletingEntry.fecha), "d 'de' MMMM yyyy", { locale: es }) : ''}
            </span>
            {deletingEntry?.descripcion ? (
              <>: <span className="font-medium text-foreground">&ldquo;{deletingEntry.descripcion}&rdquo;</span></>
            ) : null}.
            Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingEntry(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteEntry.isPending}
              onClick={async () => {
                if (!deletingEntry) return;
                try {
                  await deleteEntry.mutateAsync(deletingEntry.id);
                  toast.success('Registro eliminado');
                  setDeletingEntry(null);
                } catch {
                  toast.error('Error al eliminar el registro');
                }
              }}
            >
              {deleteEntry.isPending ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RegistroHorasModal({
  proyectos,
  onClose,
  onCreate,
  isPending,
  canWriteOthersHours = false,
  empleados = [],
}: {
  readonly proyectos: { id: string; nombre: string; codigo: string }[];
  readonly onClose: () => void;
  readonly onCreate: (data: {
    proyectoId: string;
    fecha: string;
    horas: number;
    descripcion: string;
    facturable?: boolean;
    usuarioId?: string;
  }) => Promise<void>;
  readonly isPending: boolean;
  readonly canWriteOthersHours?: boolean;
  readonly empleados?: { id: string; nombre: string; apellidos?: string }[];
}) {
  const [proyectoId, setProyectoId] = useState('');
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [horas, setHoras] = useState(1);
  const [descripcion, setDescripcion] = useState('');
  const [facturable, setFacturable] = useState(true);
  const [formUsuarioId, setFormUsuarioId] = useState<string>('');

  // When a specific employee is selected, fetch only their projects
  const { data: proyectosUsuarioData } = useProyectos(
    formUsuarioId ? { usuarioId: formUsuarioId } : undefined
  );
  const proyectosVisibles = formUsuarioId
    ? (proyectosUsuarioData?.data ?? [])
    : proyectos;

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
      ...(canWriteOthersHours && formUsuarioId ? { usuarioId: formUsuarioId } : {}),
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
            {canWriteOthersHours && (
              <div className="space-y-2">
                <label htmlFor="form-empleado" className="text-sm font-medium">Empleado</label>
                <Select
                  value={formUsuarioId || '__yo__'}
                  onValueChange={(value) => {
                    setFormUsuarioId(value === '__yo__' ? '' : value);
                    setProyectoId(''); // reset proyecto al cambiar empleado
                  }}
                >
                  <SelectTrigger id="form-empleado" className="h-10">
                    <SelectValue placeholder="Propio (yo)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__yo__">Propio (yo)</SelectItem>
                    {empleados.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        <span className="uppercase">{emp.nombre}{emp.apellidos ? ` ${emp.apellidos}` : ''}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="form-proyecto" className="text-sm font-medium">Proyecto *</label>
              <Select
                value={proyectoId || PROYECTO_PLACEHOLDER_VALUE}
                onValueChange={(value) =>
                  setProyectoId(value === PROYECTO_PLACEHOLDER_VALUE ? '' : value)
                }
              >
                <SelectTrigger id="form-proyecto" className="h-10">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PROYECTO_PLACEHOLDER_VALUE}>Seleccionar</SelectItem>
                  {proyectosVisibles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} ({p.codigo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="form-fecha" className="text-sm font-medium">Fecha *</label>
                <input
                  id="form-fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="form-horas" className="text-sm font-medium">Horas (0.01-24) *</label>
                <input
                  id="form-horas"
                  type="number"
                  min={0.01}
                  max={24}
                  step={0.01}
                  value={horas}
                  onChange={(e) => setHoras(Number(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="form-descripcion" className="text-sm font-medium">Descripción *</label>
              <textarea
                id="form-descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
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
