'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Activity } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ActivityItem, AlertItem } from '@/types/dashboard';

const TABLE_LABELS: Record<string, string> = {
  refresh_tokens: 'token de sesión',
  users: 'usuario',
  proyectos: 'proyecto',
  asignaciones: 'asignación',
  departamentos: 'departamento',
  plantillas_onboarding: 'plantilla de onboarding',
  procesos_onboarding: 'proceso de onboarding',
  tareas_onboarding: 'tarea de onboarding',
  timetracking: 'registro de horas',
  tareas: 'tarea',
};

const OPERATION_LABELS: Record<string, string> = {
  INSERT: 'Creó',
  UPDATE: 'Actualizó',
  DELETE: 'Eliminó',
};
const LOADING_ROW_KEYS = ['loading-1', 'loading-2', 'loading-3'] as const;

/**
 * Devuelve un label legible para la tabla afectada.
 * @param tableName - Nombre técnico de la tabla.
 * @returns Nombre legible para UI.
 */
const getTableLabel = (tableName?: string) => {
  if (!tableName) return 'registro';
  return TABLE_LABELS[tableName] ?? tableName.replaceAll('_', ' ');
};

/**
 * Genera un resumen legible de la actividad.
 * @param item - Item de actividad con metadatos.
 * @returns Texto resumido para UI.
 */
const buildSummary = (item: ActivityItem) => {
  if (!item.operation || !item.tableName) return item.descripcion;
  const verb = OPERATION_LABELS[item.operation] ?? item.operation;
  return `${verb} ${getTableLabel(item.tableName)}`;
};

/**
 * Genera un comando aproximado para mostrar en el detalle.
 * @param item - Item de actividad con metadatos.
 * @returns Comando representativo.
 */
const buildCommand = (item: ActivityItem) => {
  if (!item.operation || !item.tableName) return item.tipo || item.descripcion;
  const table = item.tableName;
  const recordClause = item.recordId ? ` WHERE id = '${item.recordId}'` : '';
  if (item.operation === 'UPDATE') {
    const fields = item.changedFields?.length ? item.changedFields.join(', ') : '*';
    return `UPDATE ${table} SET ${fields}${recordClause}`;
  }
  if (item.operation === 'DELETE') {
    return `DELETE FROM ${table}${recordClause}`;
  }
  return `INSERT INTO ${table}${item.recordId ? ` (id) VALUES ('${item.recordId}')` : ''}`;
};

/**
 * Formatea un objeto JSON para mostrarlo en el detalle.
 * @param value - Objeto a formatear.
 * @returns String con formato JSON.
 */
const formatJson = (value?: Record<string, unknown> | null) => {
  if (!value) return '—';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '—';
  }
};

interface ActivityListProps {
  readonly title: string;
  readonly description?: string;
  readonly items: ActivityItem[];
  readonly isLoading?: boolean;
  readonly emptyMessage?: string;
}

/**
 * Renderiza un listado de actividad reciente con estado vacío y carga.
 * @param props - Props de título, descripción, items y estado de carga.
 * @returns Tarjeta con listado de actividad o mensaje vacío.
 */
export function ActivityList({
  title,
  description,
  items,
  isLoading = false,
  emptyMessage = 'Sin actividad reciente',
}: ActivityListProps) {
  const [selectedItem, setSelectedItem] = useState<ActivityItem | null>(null);
  const selectedCommand = useMemo(
    () => (selectedItem ? buildCommand(selectedItem) : ''),
    [selectedItem]
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {LOADING_ROW_KEYS.map((key) => (
            <div key={key} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{emptyMessage}</p>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => {
                const summary = buildSummary(item);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className="flex w-full items-start gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted/60"
                      aria-label={`Ver detalle de ${summary}`}
                    >
                      <div className="p-2 rounded-full bg-muted">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{summary}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.usuarioEmail ? `por ${item.usuarioEmail}` : 'por el sistema'}
                        </p>
                      </div>
                      {item.fecha && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(item.fecha).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedItem)} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de actividad</DialogTitle>
            <DialogDescription>
              {selectedItem ? buildSummary(selectedItem) : ''}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Comando ejecutado</p>
                <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-3 text-xs text-foreground">
                  {selectedCommand}
                </pre>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Operación</p>
                  <p className="font-medium text-foreground">
                    {selectedItem.operation ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tabla</p>
                  <p className="font-medium text-foreground">
                    {selectedItem.tableName ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Registro</p>
                  <p className="font-medium text-foreground">
                    {selectedItem.recordId ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Usuario</p>
                  <p className="font-medium text-foreground">
                    {selectedItem.usuarioEmail ?? 'Sistema'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Campos modificados</p>
                  <p className="font-medium text-foreground">
                    {selectedItem.changedFields?.length
                      ? selectedItem.changedFields.join(', ')
                      : '—'}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Datos anteriores</p>
                  <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs text-foreground">
                    {formatJson(selectedItem.oldData ?? null)}
                  </pre>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Datos nuevos</p>
                  <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs text-foreground">
                    {formatJson(selectedItem.newData ?? null)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

interface AlertListProps {
  readonly title: string;
  readonly description?: string;
  readonly items: AlertItem[];
  readonly isLoading?: boolean;
  readonly emptyMessage?: string;
}

const priorityStyles = {
  CRITICA: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-900',
  ALTA: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-200 dark:border-orange-900',
  MEDIA: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900',
  BAJA: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/60 dark:text-slate-200 dark:border-slate-800',
};

/**
 * Renderiza un listado de alertas con severidad y estado vacío.
 * @param props - Props de título, descripción, items y estado de carga.
 * @returns Tarjeta con alertas o mensaje vacío.
 */
export function AlertList({
  title,
  description,
  items,
  isLoading = false,
  emptyMessage = 'Sin alertas',
}: AlertListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {LOADING_ROW_KEYS.map((key) => (
            <div key={key} className="flex items-start gap-3 p-3 border rounded-lg">
              <Skeleton className="h-5 w-5" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
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
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{emptyMessage}</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className={`flex items-start gap-3 p-3 border rounded-lg ${priorityStyles[item.prioridad]}`}
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{item.titulo}</p>
                    <Badge variant="outline" className="text-xs">
                      {item.prioridad}
                    </Badge>
                  </div>
                  {item.descripcion && (
                    <p className="text-xs opacity-80 mt-0.5 truncate">{item.descripcion}</p>
                  )}
                  {item.fecha && (
                    <p className="text-xs opacity-60 mt-1">
                      Vence: {new Date(item.fecha).toLocaleDateString('es-ES')}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
