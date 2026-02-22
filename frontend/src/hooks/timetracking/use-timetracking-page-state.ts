'use client';

/**
 * Hook que encapsula todo el estado y la lógica de datos de la página
 * de Timetracking, extrayendo esa responsabilidad del componente visual.
 *
 * Reduce la complejidad cognitiva de `TimetrackingPage` al mover fuera
 * del componente los filtros, selecciones de empleado/proyecto y los
 * handlers de operaciones CRUD.
 *
 * @returns Objeto con estado, setters, datos derivados y handlers listos
 * para ser consumidos por `TimetrackingPage`.
 */

import { useState, useMemo, useCallback } from 'react';
import { format, startOfWeek, subWeeks } from 'date-fns';
import { toast } from 'sonner';
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
import { calculateProgress } from '@/lib/gantt-utils';
import type { GanttProyecto } from '@/types/timetracking';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DeletingEntry {
  id: string;
  descripcion: string;
  fecha: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTimetrackingPageState() {
  const { user } = useAuth();
  const { canApproveHours, canViewOthersHours, canWriteOthersHours, isManager } = usePermissions();

  // ── UI state ───────────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('registros');
  const [timesheetDate, setTimesheetDate] = useState(new Date());
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [selectedTimesheetProyectoId, setSelectedTimesheetProyectoId] = useState<string | undefined>(undefined);
  const [registrosFilterUserId, setRegistrosFilterUserId] = useState<string>('__todos__');
  const [registrosFilterProyectoId, setRegistrosFilterProyectoId] = useState<string>('__todos__');
  const [deletingEntry, setDeletingEntry] = useState<DeletingEntry | null>(null);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createEntry = useCreateTimeEntry();
  const updateEntry = useUpdateTimeEntry();
  const deleteEntry = useDeleteTimeEntry();
  const copiarRegistros = useCopiarRegistros();

  // ── Registros query ────────────────────────────────────────────────────────
  const registrosFilter: Record<string, string> | undefined =
    (canViewOthersHours && registrosFilterUserId !== '__todos__') || registrosFilterProyectoId !== '__todos__'
      ? {
          ...(canViewOthersHours && registrosFilterUserId !== '__todos__' ? { usuarioId: registrosFilterUserId } : {}),
          ...(registrosFilterProyectoId === '__todos__' ? {} : { proyectoId: registrosFilterProyectoId }),
        }
      : undefined;

  const { data: registrosData, isLoading, error } = useTimeEntries(registrosFilter);
  const { data: resumen } = useResumenTimetracking();
  const registros = registrosData?.data ?? [];

  // ── Projects ───────────────────────────────────────────────────────────────
  const { data: proyectosData } = useProyectos({});
  const { data: misProyectosData, isLoading: isLoadingMisProyectos } = useMisProyectos();
  const proyectos = proyectosData?.data ?? [];
  const misProyectos = useMemo(() => misProyectosData?.data ?? [], [misProyectosData]);

  /** Mapa proyectoId → nombre para los registros del listado. */
  const proyectoNombreMap = useMemo(
    () => new Map(proyectos.map((p) => [p.id, p.nombre])),
    [proyectos]
  );

  /** Proyectos del usuario que han superado su presupuesto de horas. */
  const proyectosSobrePresupuesto = useMemo(
    () =>
      (canViewOthersHours ? proyectos : misProyectos).filter(
        (p) => (p.presupuestoHoras ?? 0) > 0 && (p.horasConsumidas ?? 0) > (p.presupuestoHoras ?? 0)
      ),
    [canViewOthersHours, proyectos, misProyectos]
  );

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

  // ── Employees ──────────────────────────────────────────────────────────────
  const canFetchAll = canViewOthersHours && !isManager;
  const { data: todosEmpleadosData } = useEmpleados({ activo: true }, canFetchAll);
  const { data: equipoData } = useEmpleadosByManager(user?.id ?? '', isManager);
  const empleadosBase = isManager ? (equipoData ?? []) : (todosEmpleadosData?.data ?? []);

  // Asignaciones del proyecto seleccionado en el timesheet
  const { data: asignacionesProyectoData } = useAsignaciones(
    selectedTimesheetProyectoId ?? '',
    canViewOthersHours && !!selectedTimesheetProyectoId
  );
  const empleadosParaSelector = useMemo(() => {
    if (!canViewOthersHours) return [];
    if (!selectedTimesheetProyectoId || !asignacionesProyectoData?.data) return empleadosBase;
    const ids = new Set(asignacionesProyectoData.data.map((a) => a.usuarioId));
    return empleadosBase.filter((emp) => ids.has(emp.id));
  }, [canViewOthersHours, selectedTimesheetProyectoId, asignacionesProyectoData, empleadosBase]);

  /** Mapa usuarioId → rol para el selector de empleado del timesheet. */
  const rolPorUsuarioId = useMemo(() => {
    if (!asignacionesProyectoData?.data) return new Map<string, string>();
    return new Map(
      asignacionesProyectoData.data
        .filter((a) => a.rol)
        .map((a) => [a.usuarioId, a.rol as string])
    );
  }, [asignacionesProyectoData]);

  // Asignaciones del proyecto seleccionado en la pestaña Registros
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

  /** Mapa usuarioId → rol para el selector de empleado en la pestaña Registros. */
  const rolPorUsuarioIdRegistros = useMemo(() => {
    if (!asignacionesRegistrosData?.data) return new Map<string, string>();
    return new Map(
      asignacionesRegistrosData.data
        .filter((a) => a.rol)
        .map((a) => [a.usuarioId, a.rol as string])
    );
  }, [asignacionesRegistrosData]);

  // ── Timesheet semanal ──────────────────────────────────────────────────────
  const weekStartStr = format(startOfWeek(timesheetDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const { data: semanaData, isLoading: isLoadingSemana } = useTimeEntriesSemana(weekStartStr, selectedUserId);
  const registrosSemana = useMemo(() => semanaData?.data ?? [], [semanaData]);

  /** Proyectos filtrados por el selector de proyecto del timesheet. */
  const proyectosTimesheetFiltrados = useMemo(
    () =>
      selectedTimesheetProyectoId
        ? proyectos.filter((p) => p.id === selectedTimesheetProyectoId)
        : proyectos,
    [proyectos, selectedTimesheetProyectoId]
  );

  /** Registros semanales filtrados por el selector de proyecto del timesheet. */
  const registrosSemanaFiltrados = useMemo(
    () =>
      selectedTimesheetProyectoId
        ? registrosSemana.filter((r) => r.proyectoId === selectedTimesheetProyectoId)
        : registrosSemana,
    [registrosSemana, selectedTimesheetProyectoId]
  );

  // ── Gantt ──────────────────────────────────────────────────────────────────
  const ganttProyectos = useMemo<GanttProyecto[]>(
    () =>
      misProyectos
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
            asignaciones: [],
          };
        }),
    [misProyectos]
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  /**
   * Actualiza o crea una entrada de tiempo al editar una celda del timesheet.
   *
   * @param proyectoId - ID del proyecto de la celda editada.
   * @param fecha - Fecha de la celda en formato 'yyyy-MM-dd'.
   * @param horas - Nuevas horas introducidas (0 actualiza a 0, >0 crea/actualiza).
   */
  const handleCellChange = useCallback(
    async (proyectoId: string, fecha: string, horas: number) => {
      const existingEntry = registrosSemana.find(
        (r) => r.proyectoId === proyectoId && r.fecha.startsWith(fecha)
      );
      try {
        if (existingEntry) {
          await updateEntry.mutateAsync({ id: existingEntry.id, data: { horas } });
        } else if (horas > 0) {
          await createEntry.mutateAsync({
            proyectoId,
            fecha,
            horas,
            descripcion: 'Registro desde timesheet',
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

  /**
   * Copia los registros de la semana anterior a la semana actual del timesheet.
   */
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

  /**
   * Elimina la entrada de tiempo que está en el estado `deletingEntry`.
   */
  const handleConfirmDelete = useCallback(async () => {
    if (!deletingEntry) return;
    try {
      await deleteEntry.mutateAsync(deletingEntry.id);
      toast.success('Registro eliminado');
      setDeletingEntry(null);
    } catch {
      toast.error('Error al eliminar el registro');
    }
  }, [deletingEntry, deleteEntry]);

  // ── Setters compuestos (reset en cascada) ──────────────────────────────────

  /**
   * Cambia el filtro de proyecto en la pestaña Registros y resetea el filtro
   * de empleado para evitar combinaciones inválidas.
   *
   * @param proyectoId - Nuevo valor del filtro ('__todos__' = sin filtro).
   */
  const handleRegistrosProyectoChange = useCallback((proyectoId: string) => {
    setRegistrosFilterProyectoId(proyectoId);
    setRegistrosFilterUserId('__todos__');
  }, []);

  /**
   * Cambia el proyecto del timesheet semanal y resetea el empleado
   * seleccionado para evitar inconsistencias.
   *
   * @param proyectoId - Nuevo valor del selector ('__todos__' = todos).
   */
  const handleTimesheetProyectoChange = useCallback((proyectoId: string) => {
    setSelectedTimesheetProyectoId(proyectoId === '__todos__' ? undefined : proyectoId);
    setSelectedUserId(undefined);
  }, []);

  return {
    // Permissions & user
    user,
    canApproveHours,
    canViewOthersHours,
    canWriteOthersHours,
    isManager,
    // UI state
    showForm,
    setShowForm,
    activeTab,
    setActiveTab,
    timesheetDate,
    setTimesheetDate,
    showCopyDialog,
    setShowCopyDialog,
    selectedUserId,
    setSelectedUserId,
    selectedTimesheetProyectoId,
    registrosFilterUserId,
    setRegistrosFilterUserId,
    registrosFilterProyectoId,
    registrosProyectoActivo,
    deletingEntry,
    setDeletingEntry,
    // Loading / errors
    isLoading,
    isLoadingSemana,
    isLoadingMisProyectos,
    error,
    // Data
    registros,
    resumen,
    proyectos,
    misProyectos,
    misProyectosData,
    proyectoNombreMap,
    proyectosSobrePresupuesto,
    selectedProyectoRegistros,
    selectedProyectoTimesheet,
    empleadosBase,
    empleadosParaSelector,
    empleadosParaRegistros,
    rolPorUsuarioId,
    rolPorUsuarioIdRegistros,
    registrosSemana,
    registrosSemanaFiltrados,
    proyectosTimesheetFiltrados,
    ganttProyectos,
    // Mutations
    createEntry,
    deleteEntry,
    copiarRegistros,
    // Handlers
    handleCellChange,
    handleCopyWeek,
    handleConfirmDelete,
    handleRegistrosProyectoChange,
    handleTimesheetProyectoChange,
  };
}
