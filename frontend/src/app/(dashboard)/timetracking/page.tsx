'use client';

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
import { useProyectos } from '@/hooks/use-proyectos';
import type { Proyecto } from '@/hooks/proyectos/types';
import type { TimeEntry } from '@/hooks/timetracking/types';
import type { User } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';

// Componentes Timesheet
import { WeekNavigation } from '@/components/timetracking/week-navigation';
import { TimesheetGrid } from '@/components/timetracking/timesheet-grid';
import { CopyWeekDialog } from '@/components/timetracking/copy-week-dialog';

// Componentes Gantt
import { GanttChart } from '@/components/timetracking/gantt-chart';

import { useTimetrackingPageState } from '@/hooks/timetracking/use-timetracking-page-state';

const PROYECTO_PLACEHOLDER_VALUE = '__seleccionar__';
const LOADING_REGISTROS_KEYS = ['loading-1', 'loading-2', 'loading-3', 'loading-4', 'loading-5'] as const;

// ---------------------------------------------------------------------------
// Helpers de presentación (pura lógica visual, sin negocio)
// ---------------------------------------------------------------------------

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

/**
 * Devuelve los estilos de color asociados a un estado de timetracking.
 *
 * @param estado - Estado del registro ('APROBADO' | 'RECHAZADO' | 'PENDIENTE').
 * @returns Objeto con clases Tailwind para dot, text y bg.
 */
function getEstadoStyle(estado: string) {
  return ESTADO_STYLES[estado] ?? { dot: 'bg-slate-400', text: 'text-slate-400', bg: 'bg-slate-400/10' };
}

/**
 * Extrae un mensaje de error de API sin type assertions.
 *
 * @param error - Valor de error desconocido capturado en un catch.
 * @param fallback - Mensaje a mostrar si no se puede extraer uno de `error`.
 * @returns Mensaje de error como string.
 */
function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'error' in error) {
    const maybeError = error.error;
    if (typeof maybeError === 'string' && maybeError.length > 0) return maybeError;
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

const PROYECTO_PLACEHOLDER_VALUE = '__seleccionar__';
const LOADING_REGISTROS_KEYS = ['loading-1', 'loading-2', 'loading-3', 'loading-4', 'loading-5'] as const;

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
  const state = useTimetrackingPageState();

  return (
    <div className="space-y-6">
      <PageHeader
        canApproveHours={state.canApproveHours}
        onNewEntry={() => state.setShowForm(true)}
        onGoToApproval={() => router.push('/timetracking/aprobacion')}
      />

      {state.resumen && <ResumenCard resumen={state.resumen} />}

      <PresupuestoAlert proyectos={state.proyectosSobrePresupuesto} />

      <Tabs value={state.activeTab} onValueChange={state.setActiveTab}>
        <TabsList>
          <TabsTrigger value="registros">{state.canViewOthersHours ? 'Registros' : 'Mis Registros'}</TabsTrigger>
          <TabsTrigger value="timesheet">Timesheet Semanal</TabsTrigger>
          <TabsTrigger value="gantt">Diagrama Gantt</TabsTrigger>
        </TabsList>

        <TabsContent value="registros">
          <RegistrosTab state={state} />
        </TabsContent>

        <TabsContent value="timesheet">
          <TimesheetTab state={state} />
        </TabsContent>

        <TabsContent value="gantt">
          <GanttChart proyectos={state.ganttProyectos} isLoading={state.isLoadingMisProyectos} />
        </TabsContent>
      </Tabs>

      {state.showForm && (
        <RegistroHorasModal
          proyectos={state.proyectos}
          onClose={() => state.setShowForm(false)}
          onCreate={async (data) => {
            try {
              await state.createEntry.mutateAsync(data);
              toast.success('Registro creado');
              state.setShowForm(false);
            } catch (err: unknown) {
              toast.error(getApiErrorMessage(err, 'Error al crear'));
            }
          }}
          isPending={state.createEntry.isPending}
          canWriteOthersHours={state.canWriteOthersHours}
          empleados={state.empleadosParaSelector}
        />
      )}

      <DeleteEntryDialog
        deletingEntry={state.deletingEntry}
        onCancel={() => state.setDeletingEntry(null)}
        onConfirm={state.handleConfirmDelete}
        isPending={state.deleteEntry.isPending}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Cabecera de la página con título y botones de acción.
 *
 * @param canApproveHours - Si el usuario tiene permiso de aprobar horas.
 * @param onNewEntry - Callback para abrir el modal de nuevo registro.
 * @param onGoToApproval - Callback para navegar a la página de aprobaciones.
 */
function PageHeader({
  canApproveHours,
  onNewEntry,
  onGoToApproval,
}: {
  readonly canApproveHours: boolean;
  readonly onNewEntry: () => void;
  readonly onGoToApproval: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Timetracking</h1>
        <p className="text-muted-foreground">Registro y consulta de horas</p>
      </div>
      <div className="flex gap-2">
        <Button onClick={onNewEntry}>
          <Plus className="mr-2 h-4 w-4" />
          Registrar horas
        </Button>
        {canApproveHours && (
          <Button variant="outline" onClick={onGoToApproval}>
            Pendientes de aprobación
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Card de resumen de horas totales, facturables y no facturables.
 *
 * @param resumen - Datos de resumen devueltos por la API.
 */
function ResumenCard({ resumen }: { readonly resumen: { totalHoras?: number | string; horasFacturables?: number | string; horasNoFacturables?: number | string } }) {
  return (
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
  );
}

/**
 * Banner de advertencia que lista los proyectos con horas consumidas
 * por encima del presupuesto. No se renderiza si la lista está vacía.
 *
 * @param proyectos - Lista de proyectos sobre presupuesto.
 */
function PresupuestoAlert({
  proyectos,
}: {
  readonly proyectos: { id: string; nombre: string; horasConsumidas?: number | null; presupuestoHoras?: number | null }[];
}) {
  if (proyectos.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
      <div className="flex items-center gap-2 text-amber-400">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm font-semibold">
          {proyectos.length === 1
            ? '1 proyecto ha superado su presupuesto de horas'
            : `${proyectos.length} proyectos han superado su presupuesto de horas`}
        </span>
      </div>
      <ul className="ml-6 space-y-0.5">
        {proyectos.map((p) => (
          <li key={p.id} className="text-xs text-amber-300">
            <span className="font-medium">{p.nombre}</span>{' — '}
            {(p.horasConsumidas ?? 0).toFixed(1)}h consumidas de {(p.presupuestoHoras ?? 0).toFixed(1)}h
            {' '}(<span className="font-semibold">+{((p.horasConsumidas ?? 0) - (p.presupuestoHoras ?? 0)).toFixed(1)}h</span>)
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Alert inline que aparece cuando el proyecto seleccionado supera su presupuesto.
 * No se renderiza si no hay proyecto o si no supera el límite.
 *
 * @param proyecto - Proyecto actualmente seleccionado, o undefined.
 */
function ProyectoPresupuestoAlert({
  proyecto,
}: {
  readonly proyecto: { nombre: string; horasConsumidas?: number | null; presupuestoHoras?: number | null } | undefined;
}) {
  if (
    !proyecto ||
    (proyecto.presupuestoHoras ?? 0) <= 0 ||
    (proyecto.horasConsumidas ?? 0) <= (proyecto.presupuestoHoras ?? 0)
  ) return null;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-400">
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <p className="text-sm">
        <span className="font-semibold">{proyecto.nombre}</span> ha superado su presupuesto:{' '}
        <span className="font-semibold">{(proyecto.horasConsumidas ?? 0).toFixed(1)}h</span>
        {' '}de{' '}
        <span className="font-semibold">{(proyecto.presupuestoHoras ?? 0).toFixed(1)}h</span>
        {' '}presupuestadas{' '}
        (<span className="font-semibold">+{((proyecto.horasConsumidas ?? 0) - (proyecto.presupuestoHoras ?? 0)).toFixed(1)}h</span>).
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Registros tab
// ---------------------------------------------------------------------------

/** Props comunes derivadas del estado de la página para los sub-tabs. */
type PageState = ReturnType<typeof useTimetrackingPageState>;

/**
 * Contenido de la pestaña "Registros": filtros, lista de entradas y alertas.
 *
 * @param state - Estado completo devuelto por `useTimetrackingPageState`.
 */
function RegistrosTab({ state }: { readonly state: PageState }) {
  const listaProyectos = state.canViewOthersHours ? state.proyectos : state.misProyectos;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{state.canViewOthersHours ? 'Registros' : 'Mis registros'}</CardTitle>
            <CardDescription>Listado de entradas de tiempo</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Proyecto:</span>
              <Select value={state.registrosFilterProyectoId} onValueChange={state.handleRegistrosProyectoChange}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__todos__">Todos</SelectItem>
                  {listaProyectos.map((p: Proyecto) => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {state.canViewOthersHours && state.empleadosParaRegistros.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Empleado:</span>
                <Select value={state.registrosFilterUserId} onValueChange={state.setRegistrosFilterUserId}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__todos__">Todos</SelectItem>
                    {state.empleadosParaRegistros.map((emp: User) => (
                      <SelectItem key={emp.id} value={emp.id} textValue={`${emp.nombre} ${emp.apellidos}`}>
                        <span className="uppercase">{emp.nombre} {emp.apellidos}</span>
                        {state.registrosProyectoActivo && state.rolPorUsuarioIdRegistros.get(emp.id) && (
                          <span className="ml-1.5 text-xs text-muted-foreground">({state.rolPorUsuarioIdRegistros.get(emp.id)})</span>
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
        <ProyectoPresupuestoAlert proyecto={state.selectedProyectoRegistros} />
        <RegistrosList state={state} />
      </CardContent>
    </Card>
  );
}

/**
 * Lista de registros de timetracking con estados de carga y vacío.
 *
 * @param state - Estado completo devuelto por `useTimetrackingPageState`.
 */
function RegistrosList({ state }: { readonly state: PageState }) {
  if (state.isLoading) {
    return (
      <div className="space-y-2">
        {LOADING_REGISTROS_KEYS.map((key) => <Skeleton key={key} className="h-12" />)}
      </div>
    );
  }
  if (state.error) {
    return <p className="text-sm text-red-600">Error al cargar registros</p>;
  }
  if (state.registros.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No hay registros</p>
        <Button onClick={() => state.setShowForm(true)} className="mt-4">
          <Plus className="mr-2 h-4 w-4" />
          Registrar horas
        </Button>
      </div>
    );
  }
  return (
    <div className="divide-y divide-border">
      {state.registros.slice(0, 50).map((r: TimeEntry) => (
        <RegistroRow
          key={r.id}
          registro={r}
          proyectoNombre={state.proyectoNombreMap.get(r.proyectoId)}
          canViewOthersHours={state.canViewOthersHours}
          canWriteOthersHours={state.canWriteOthersHours}
          userId={state.user?.id}
          onDelete={(entry) => state.setDeletingEntry(entry)}
        />
      ))}
    </div>
  );
}

/**
 * Fila individual de un registro de timetracking.
 *
 * @param registro - Datos del registro.
 * @param proyectoNombre - Nombre del proyecto asociado, si existe.
 * @param canViewOthersHours - Si el usuario puede ver horas de otros.
 * @param canWriteOthersHours - Si el usuario puede editar horas de otros.
 * @param userId - ID del usuario autenticado.
 * @param onDelete - Callback al pulsar el botón de eliminar.
 */
function RegistroRow({
  registro: r,
  proyectoNombre,
  canViewOthersHours,
  canWriteOthersHours,
  userId,
  onDelete,
}: {
  readonly registro: {
    id: string;
    fecha: string;
    horas?: number | string | null;
    descripcion?: string | null;
    proyectoId: string;
    usuarioId: string;
    usuarioNombre?: string | null;
    estado: string;
    facturable?: boolean | null;
  };
  readonly proyectoNombre: string | undefined;
  readonly canViewOthersHours: boolean;
  readonly canWriteOthersHours: boolean;
  readonly userId: string | undefined;
  readonly onDelete: (entry: { id: string; descripcion: string; fecha: string }) => void;
}) {
  const estadoStyle = getEstadoStyle(r.estado);
  const horas = Number(r.horas ?? 0);
  const canDelete = canWriteOthersHours || (r.usuarioId === userId && r.estado === 'PENDIENTE');

  return (
    <div className="group flex items-center gap-4 px-1 py-3.5 hover:bg-muted/40 transition-colors">
      <div className={`h-8 w-1 rounded-full flex-shrink-0 ${estadoStyle.dot}`} />
      <div className="w-28 flex-shrink-0">
        <span className="text-sm font-semibold text-foreground">
          {format(new Date(r.fecha), 'd MMM yyyy', { locale: es })}
        </span>
      </div>
      <div className={`flex-shrink-0 rounded-md px-2.5 py-0.5 text-sm font-bold tabular-nums ${getHorasColor(horas)}`}>
        {horas % 1 === 0 ? horas : horas.toFixed(1)}h
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {proyectoNombre && (
          <div className="flex flex-shrink-0 items-center gap-1 rounded-md bg-muted px-2 py-0.5">
            <Briefcase className="h-3 w-3 text-muted-foreground" />
            <span className="max-w-[160px] truncate text-xs font-medium text-muted-foreground">{proyectoNombre}</span>
          </div>
        )}
        <span className="truncate text-sm text-muted-foreground">{r.descripcion}</span>
      </div>
      {canViewOthersHours && r.usuarioNombre && (
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
            {r.usuarioNombre.charAt(0).toUpperCase()}
          </div>
          <span className="hidden text-sm font-medium text-foreground uppercase sm:inline">{r.usuarioNombre}</span>
        </div>
      )}
      {r.facturable && (
        <div className="flex-shrink-0" title="Facturable">
          <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
        </div>
      )}
      <div className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${estadoStyle.bg} ${estadoStyle.text}`}>
        {r.estado === 'APROBADO'  && <CheckCircle className="h-3 w-3" />}
        {r.estado === 'RECHAZADO' && <XCircle className="h-3 w-3" />}
        {r.estado}
      </div>
      {canDelete && (
        <button
          type="button"
          title="Eliminar registro"
          onClick={() => onDelete({ id: r.id, descripcion: r.descripcion ?? '', fecha: r.fecha })}
          className="flex-shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/15 hover:text-destructive text-muted-foreground"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timesheet tab
// ---------------------------------------------------------------------------

/**
 * Contenido de la pestaña "Timesheet Semanal": selectores, alertas y grid.
 *
 * @param state - Estado completo devuelto por `useTimetrackingPageState`.
 */
function TimesheetTab({ state }: { readonly state: PageState }) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Timesheet Semanal</CardTitle>
          <CardDescription>Vista de horas por proyecto y día de la semana</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TimesheetFilters state={state} />
          <ProyectoPresupuestoAlert proyecto={state.selectedProyectoTimesheet} />
          <WeekNavigation
            currentDate={state.timesheetDate}
            onDateChange={state.setTimesheetDate}
            onCopyWeek={() => state.setShowCopyDialog(true)}
          />
          <TimesheetGrid
            currentDate={state.timesheetDate}
            registros={state.registrosSemanaFiltrados}
            proyectos={state.proyectosTimesheetFiltrados}
            isLoading={state.isLoadingSemana}
            onCellChange={state.handleCellChange}
          />
        </CardContent>
      </Card>
      <CopyWeekDialog
        open={state.showCopyDialog}
        onOpenChange={state.setShowCopyDialog}
        currentDate={state.timesheetDate}
        onConfirm={state.handleCopyWeek}
        isPending={state.copiarRegistros.isPending}
      />
    </>
  );
}

/**
 * Selectores de empleado y proyecto del timesheet semanal.
 *
 * @param state - Estado completo devuelto por `useTimetrackingPageState`.
 */
function TimesheetFilters({ state }: { readonly state: PageState }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {state.canViewOthersHours && state.empleadosParaSelector.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Empleado:</span>
          <Select
            value={state.selectedUserId ?? '__propio__'}
            onValueChange={(v) => state.setSelectedUserId(v === '__propio__' ? undefined : v)}
          >
            <SelectTrigger className="w-56"><SelectValue placeholder="Mis horas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__propio__">Mis horas</SelectItem>
              {state.empleadosParaSelector.map((emp: User) => (
                <SelectItem key={emp.id} value={emp.id}>
                  <span className="uppercase">{emp.nombre} {emp.apellidos}</span>
                  {state.selectedTimesheetProyectoId && state.rolPorUsuarioId.get(emp.id) && (
                    <span className="ml-1.5 text-xs text-muted-foreground">({state.rolPorUsuarioId.get(emp.id)})</span>
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
          value={state.selectedTimesheetProyectoId ?? '__todos__'}
          onValueChange={state.handleTimesheetProyectoChange}
        >
          <SelectTrigger className="w-56"><SelectValue placeholder="Todos los proyectos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__todos__">Todos los proyectos</SelectItem>
            {state.proyectos.map((p: Proyecto) => (
              <SelectItem key={p.id} value={p.id}>{p.nombre} ({p.codigo})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete confirmation dialog
// ---------------------------------------------------------------------------

/**
 * Diálogo modal de confirmación para eliminar un registro de timetracking.
 *
 * @param deletingEntry - Registro pendiente de eliminar, o null si no hay ninguno.
 * @param onCancel - Callback para cerrar el diálogo sin eliminar.
 * @param onConfirm - Callback async para ejecutar la eliminación.
 * @param isPending - Si la mutación de eliminación está en curso.
 */
function DeleteEntryDialog({
  deletingEntry,
  onCancel,
  onConfirm,
  isPending,
}: {
  readonly deletingEntry: { id: string; descripcion: string; fecha: string } | null;
  readonly onCancel: () => void;
  readonly onConfirm: () => Promise<void>;
  readonly isPending: boolean;
}) {
  return (
    <Dialog open={!!deletingEntry} onOpenChange={(open) => { if (!open) onCancel(); }}>
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
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button variant="destructive" disabled={isPending} onClick={onConfirm}>
            {isPending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// RegistroHorasModal
// ---------------------------------------------------------------------------

/**
 * Modal para crear un nuevo registro de horas.
 *
 * @param proyectos - Lista de proyectos disponibles para el selector.
 * @param onClose - Callback para cerrar el modal.
 * @param onCreate - Callback async para enviar el formulario.
 * @param isPending - Si la mutación de creación está en curso.
 * @param canWriteOthersHours - Si el usuario puede registrar horas en nombre de otro.
 * @param empleados - Lista de empleados disponibles en el selector de usuario.
 */
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

  const { data: proyectosUsuarioData } = useProyectos(
    formUsuarioId ? { usuarioId: formUsuarioId } : undefined
  );
  const proyectosVisibles = formUsuarioId ? (proyectosUsuarioData?.data ?? []) : proyectos;

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
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">×</Button>
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
                    setProyectoId('');
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
                onValueChange={(value) => setProyectoId(value === PROYECTO_PLACEHOLDER_VALUE ? '' : value)}
              >
                <SelectTrigger id="form-proyecto" className="h-10">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PROYECTO_PLACEHOLDER_VALUE}>Seleccionar</SelectItem>
                  {proyectosVisibles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre} ({p.codigo})</SelectItem>
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
