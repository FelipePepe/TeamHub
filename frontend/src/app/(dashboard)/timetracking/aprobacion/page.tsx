'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  usePendientesAprobacion,
  useAprobarTimeEntry,
  useRechazarTimeEntry,
  useAprobarMasivo,
  type PendienteAprobacionGrupo,
} from '@/hooks/use-timetracking';
import { usePermissions } from '@/hooks/use-permissions';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TimetrackingAprobacionPage() {
  const router = useRouter();
  const { canApproveHours } = usePermissions();
  const { data, isLoading, error } = usePendientesAprobacion(canApproveHours);
  const aprobar = useAprobarTimeEntry();
  const rechazar = useRechazarTimeEntry();
  const aprobarMasivo = useAprobarMasivo();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rechazarModal, setRechazarModal] = useState<{ id: string; comentario: string } | null>(null);

  if (!canApproveHours) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acceso denegado</CardTitle>
            <CardDescription>No tienes permisos para aprobar horas</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => router.push('/timetracking')}>
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const grupos: PendienteAprobacionGrupo[] = data?.data ?? [];

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectGroup = (ids: string[]) => {
    const allSelected = ids.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => new Set([...prev, ...ids]));
    }
  };

  const handleAprobar = async (id: string) => {
    try {
      await aprobar.mutateAsync({ id });
      toast.success('Registro aprobado');
    } catch {
      toast.error('Error al aprobar');
    }
  };

  const handleRechazar = async (id: string, comentario: string) => {
    try {
      await rechazar.mutateAsync({ id, comentario });
      toast.success('Registro rechazado');
      setRechazarModal(null);
    } catch {
      toast.error('Error al rechazar');
    }
  };

  const handleAprobarMasivo = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.error('Selecciona al menos un registro');
      return;
    }
    try {
      await aprobarMasivo.mutateAsync(ids);
      toast.success(`${ids.length} registro(s) aprobado(s)`);
      setSelectedIds(new Set());
    } catch {
      toast.error('Error en aprobación masiva');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Pendientes de aprobación</h1>
          <p className="text-slate-500">GET /timetracking/pendientes-aprobacion</p>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">{selectedIds.size} seleccionado(s)</span>
              <Button onClick={handleAprobarMasivo} disabled={aprobarMasivo.isPending}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprobar selección
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Grupos pendientes
          </CardTitle>
          <CardDescription>Por usuario y proyecto</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-red-600">Error al cargar pendientes</p>
          ) : grupos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="mb-4 h-12 w-12 text-green-500" />
              <p className="text-sm text-slate-500">No hay registros pendientes de aprobación</p>
              <Button variant="outline" onClick={() => router.push('/timetracking')} className="mt-4">
                Volver a Timetracking
              </Button>
            </div>
          ) : (
            <ul className="space-y-6">
              {grupos.map((grupo) => (
                <li key={`${grupo.usuarioId}-${grupo.proyectoId}`} className="border-b border-slate-200 pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{grupo.usuarioNombre ?? grupo.usuarioId}</p>
                      <p className="text-sm text-slate-500">{grupo.proyectoNombre ?? grupo.proyectoId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{grupo.totalHoras}h total</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSelectGroup(grupo.registros.map((r) => r.id))}
                      >
                        {grupo.registros.every((r) => selectedIds.has(r.id)) ? 'Quitar' : 'Seleccionar todo'}
                      </Button>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {grupo.registros.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(r.id)}
                            onChange={() => toggleSelect(r.id)}
                            aria-label={`Seleccionar ${r.id}`}
                          />
                          <span className="text-sm">{format(new Date(r.fecha), 'd MMM yyyy', { locale: es })}</span>
                          <span className="font-medium">{r.horas}h</span>
                          <span className="text-slate-600 truncate max-w-[200px]">{r.descripcion}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAprobar(r.id)}
                            disabled={aprobar.isPending}
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRechazarModal({ id: r.id, comentario: '' })}
                            disabled={rechazar.isPending}
                          >
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {rechazarModal && (
        <RechazarModal
          id={rechazarModal.id}
          comentario={rechazarModal.comentario}
          onComentarioChange={(c) => setRechazarModal((p) => (p ? { ...p, comentario: c } : null))}
          onConfirm={() => {
            if (rechazarModal.comentario.trim()) {
              handleRechazar(rechazarModal.id, rechazarModal.comentario.trim());
            } else {
              toast.error('El comentario es obligatorio para rechazar');
            }
          }}
          onCancel={() => setRechazarModal(null)}
          isPending={rechazar.isPending}
        />
      )}
    </div>
  );
}

function RechazarModal({
  id,
  comentario,
  onComentarioChange,
  onConfirm,
  onCancel,
  isPending,
}: {
  id: string;
  comentario: string;
  onComentarioChange: (c: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Rechazar registro (RejectTimetrackingRequest)</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Cerrar">×</Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-2">Comentario obligatorio:</p>
          <textarea
            value={comentario}
            onChange={(e) => onComentarioChange(e.target.value)}
            rows={3}
            className="flex w-full rounded-md border border-slate-200 px-3 py-2 text-sm mb-4"
            placeholder="Motivo del rechazo..."
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button variant="destructive" onClick={onConfirm} disabled={!comentario.trim() || isPending}>
              Rechazar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
