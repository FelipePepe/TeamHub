'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, MoreVertical, Trash2, UserCheck, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskFormModal } from './task-form-modal';
import {
  useUpdateEstadoTarea,
  useReasignarTarea,
  useDeleteTarea,
} from '@/hooks/use-tareas';
import { useEmpleados } from '@/hooks/use-empleados';
import { toast } from 'sonner';
import type { Tarea, EstadoTarea, PrioridadTarea } from '@/types';

interface TaskListProps {
  proyectoId: string;
  tareas: Tarea[];
  isLoading?: boolean;
}

const ESTADO_COLORS: Record<EstadoTarea, string> = {
  TODO: 'secondary',
  IN_PROGRESS: 'default',
  REVIEW: 'outline',
  DONE: 'success',
  BLOCKED: 'destructive',
};

const ESTADO_LABELS: Record<EstadoTarea, string> = {
  TODO: 'Por hacer',
  IN_PROGRESS: 'En progreso',
  REVIEW: 'En revisión',
  DONE: 'Completada',
  BLOCKED: 'Bloqueada',
};

const PRIORIDAD_COLORS: Record<PrioridadTarea, string> = {
  LOW: 'secondary',
  MEDIUM: 'default',
  HIGH: 'outline',
  URGENT: 'destructive',
};

const PRIORIDAD_LABELS: Record<PrioridadTarea, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

export function TaskList({ proyectoId, tareas, isLoading }: TaskListProps) {
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedTarea, setSelectedTarea] = useState<Tarea | undefined>();
  const [filterEstado, setFilterEstado] = useState<EstadoTarea | 'all'>('all');
  const [filterUsuario, setFilterUsuario] = useState<string>('all');
  const [showReasignarModal, setShowReasignarModal] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const updateEstadoTarea = useUpdateEstadoTarea();
  const reasignarTarea = useReasignarTarea();
  const deleteTarea = useDeleteTarea();
  const { data: empleadosData } = useEmpleados({ activo: true, limit: 500 });
  const empleados = empleadosData?.data ?? [];

  // Filtros
  const tareasFiltradas = useMemo(() => {
    return tareas.filter((tarea) => {
      if (filterEstado !== 'all' && tarea.estado !== filterEstado) return false;
      if (
        filterUsuario !== 'all' &&
        tarea.usuarioAsignadoId !== (filterUsuario === 'sin-asignar' ? null : filterUsuario)
      )
        return false;
      return true;
    });
  }, [tareas, filterEstado, filterUsuario]);

  // Usuarios únicos para filtro
  const usuariosUnicos = useMemo(() => {
    const map = new Map<string, { id: string; nombre: string }>();
    tareas.forEach((tarea) => {
      if (tarea.usuarioAsignado) {
        map.set(tarea.usuarioAsignado.id, {
          id: tarea.usuarioAsignado.id,
          nombre: `${tarea.usuarioAsignado.nombre} ${tarea.usuarioAsignado.apellidos || ''}`,
        });
      }
    });
    return Array.from(map.values());
  }, [tareas]);

  const handleCreateTask = () => {
    setSelectedTarea(undefined);
    setShowFormModal(true);
  };

  const handleEditTask = (tarea: Tarea) => {
    setSelectedTarea(tarea);
    setShowFormModal(true);
  };

  const handleChangeEstado = async (tareaId: string, nuevoEstado: EstadoTarea) => {
    try {
      await updateEstadoTarea.mutateAsync({ id: tareaId, estado: nuevoEstado });
      toast.success('Estado actualizado');
    } catch {
      toast.error('Error al actualizar estado');
    }
  };

  const handleReasignar = async (tareaId: string, usuarioAsignadoId: string) => {
    try {
      await reasignarTarea.mutateAsync({ id: tareaId, usuarioAsignadoId });
      toast.success('Tarea reasignada');
      setShowReasignarModal(null);
    } catch {
      toast.error('Error al reasignar tarea');
    }
  };

  const handleDelete = async (tareaId: string) => {
    try {
      await deleteTarea.mutateAsync(tareaId);
      toast.success('Tarea eliminada');
      setShowDeleteConfirm(null);
    } catch {
      toast.error('Error al eliminar tarea');
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Lista de Tareas</CardTitle>
              <CardDescription>Gestiona las tareas del proyecto</CardDescription>
            </div>
            <Button onClick={handleCreateTask}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Tarea
            </Button>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-4 pt-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <Select value={filterEstado} onValueChange={(v) => setFilterEstado(v as EstadoTarea | 'all')}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {(Object.keys(ESTADO_LABELS) as EstadoTarea[]).map((estado) => (
                    <SelectItem key={estado} value={estado}>
                      {ESTADO_LABELS[estado]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Select value={filterUsuario} onValueChange={setFilterUsuario}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Usuario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  <SelectItem value="sin-asignar">Sin asignar</SelectItem>
                  {usuariosUnicos.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(filterEstado !== 'all' || filterUsuario !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterEstado('all');
                  setFilterUsuario('all');
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 w-full animate-pulse rounded bg-slate-100" />
              ))}
            </div>
          ) : tareasFiltradas.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-slate-500">
              {tareas.length === 0 ? 'No hay tareas' : 'No hay tareas que coincidan con los filtros'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Asignado a</TableHead>
                    <TableHead>Fechas</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tareasFiltradas.map((tarea) => (
                    <TableRow
                      key={tarea.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => handleEditTask(tarea)}
                    >
                      <TableCell className="font-medium">{tarea.titulo}</TableCell>
                      <TableCell>
                        <Badge variant={ESTADO_COLORS[tarea.estado] as 'default' | 'secondary' | 'destructive' | 'outline' | 'success'}>
                          {ESTADO_LABELS[tarea.estado]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={PRIORIDAD_COLORS[tarea.prioridad] as 'default' | 'secondary' | 'destructive' | 'outline'}>
                          {PRIORIDAD_LABELS[tarea.prioridad]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tarea.usuarioAsignado
                          ? `${tarea.usuarioAsignado.nombre} ${tarea.usuarioAsignado.apellidos || ''}`
                          : 'Sin asignar'}
                      </TableCell>
                      <TableCell>
                        {tarea.fechaInicio && tarea.fechaFin ? (
                          <span className="text-xs">
                            {format(new Date(tarea.fechaInicio), 'd MMM', { locale: es })} -{' '}
                            {format(new Date(tarea.fechaFin), 'd MMM yy', { locale: es })}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Sin fechas</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">
                          {tarea.horasEstimadas ? `${tarea.horasEstimadas}h` : '—'} est.
                          {tarea.horasReales ? ` / ${tarea.horasReales}h reales` : ''}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTask(tarea);
                              }}
                            >
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Cambiar estado</DropdownMenuLabel>
                            {(Object.keys(ESTADO_LABELS) as EstadoTarea[])
                              .filter((e) => e !== tarea.estado)
                              .map((estado) => (
                                <DropdownMenuItem
                                  key={estado}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleChangeEstado(tarea.id, estado);
                                  }}
                                >
                                  {ESTADO_LABELS[estado]}
                                </DropdownMenuItem>
                              ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowReasignarModal(tarea.id);
                              }}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Reasignar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteConfirm(tarea.id);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de formulario */}
      <TaskFormModal
        open={showFormModal}
        onOpenChange={setShowFormModal}
        proyectoId={proyectoId}
        tarea={selectedTarea}
        onSuccess={() => setShowFormModal(false)}
      />

      {/* Modal de reasignar */}
      {showReasignarModal && (
        <ReasignarModal
          tareaId={showReasignarModal}
          tarea={tareas.find((t) => t.id === showReasignarModal)}
          empleados={empleados}
          onReasignar={handleReasignar}
          onClose={() => setShowReasignarModal(null)}
        />
      )}

      {/* Confirmación de eliminación */}
      {showDeleteConfirm && (
        <Dialog open onOpenChange={() => setShowDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={deleteTarea.isPending}
              >
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function ReasignarModal({
  tareaId,
  tarea,
  empleados,
  onReasignar,
  onClose,
}: {
  tareaId: string;
  tarea?: Tarea;
  empleados: { id: string; nombre: string; apellidos?: string }[];
  onReasignar: (tareaId: string, usuarioId: string) => void;
  onClose: () => void;
}) {
  const [usuarioId, setUsuarioId] = useState('');

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reasignar Tarea</DialogTitle>
          <DialogDescription>
            {tarea && `Reasignar "${tarea.titulo}" a otro usuario`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Usuario</Label>
            <Select value={usuarioId} onValueChange={setUsuarioId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar usuario" />
              </SelectTrigger>
              <SelectContent>
                {empleados.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.nombre} {emp.apellidos || ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onReasignar(tareaId, usuarioId)} disabled={!usuarioId}>
            Reasignar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
