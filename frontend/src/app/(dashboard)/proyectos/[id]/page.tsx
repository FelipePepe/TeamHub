'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  User,
  BarChart3,
  Users,
  Edit2,
  Trash2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  useProyecto,
  useProyectoStats,
  useAsignaciones,
  useUpdateProyectoEstado,
  useDeleteProyecto,
  useCreateAsignacion,
  useDeleteAsignacion,
  type ProyectoEstado,
} from '@/hooks/use-proyectos';
import { useEmpleados } from '@/hooks/use-empleados';
import { usePermissions } from '@/hooks/use-permissions';
import { useTareasByProyecto } from '@/hooks/use-tareas';
import { TaskList } from '@/components/tareas/task-list';
import { TaskGanttChart } from '@/components/tareas/task-gantt-chart';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ESTADOS: { value: ProyectoEstado; label: string }[] = [
  { value: 'PLANIFICACION', label: 'Planificación' },
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'PAUSADO', label: 'Pausado' },
  { value: 'COMPLETADO', label: 'Completado' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

export default function ProyectoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { canManageProjects } = usePermissions();

  const { data: proyecto, isLoading, error } = useProyecto(id);
  const { data: stats } = useProyectoStats(id);
  const { data: asignacionesData } = useAsignaciones(id);
  const { data: tareasData, isLoading: tareasLoading } = useTareasByProyecto(id);
  const updateEstado = useUpdateProyectoEstado();
  const deleteProyecto = useDeleteProyecto();
  const { data: empleadosData } = useEmpleados({ activo: true, limit: 500 });
  const empleados = empleadosData?.data ?? [];
  const asignaciones = asignacionesData?.data ?? [];
  const tareas = tareasData?.data ?? [];

  const handleDelete = async () => {
    if (!proyecto || !confirm(`¿Eliminar el proyecto "${proyecto.nombre}"?`)) return;
    try {
      await deleteProyecto.mutateAsync(proyecto.id);
      toast.success('Proyecto eliminado');
      router.push('/proyectos');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleEstadoChange = async (nuevoEstado: ProyectoEstado) => {
    try {
      await updateEstado.mutateAsync({ id, estado: nuevoEstado });
      toast.success('Estado actualizado');
    } catch {
      toast.error('Error al actualizar estado');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (error || !proyecto) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>No se pudo cargar el proyecto</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => router.push('/proyectos')}>
              Volver a proyectos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const estadoLabel = ESTADOS.find((e) => e.value === proyecto.estado)?.label ?? proyecto.estado;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Volver">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{proyecto.nombre}</h1>
            <p className="text-slate-500">{proyecto.codigo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canManageProjects && (
            <>
              <select
                value={proyecto.estado}
                onChange={(e) => handleEstadoChange(e.target.value as ProyectoEstado)}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                aria-label="Cambiar estado"
              >
                {ESTADOS.map((e) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
              <Button variant="outline" size="sm" onClick={() => router.push(`/proyectos?editar=${proyecto.id}`)}>
                <Edit2 className="mr-1 h-4 w-4" />
                Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="mr-1 h-4 w-4" />
                Eliminar
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="resumen" className="space-y-6">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="tareas">Tareas</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Información
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Estado:</span>
              <Badge variant="outline">{estadoLabel}</Badge>
            </div>
            {proyecto.cliente && <div><span className="font-medium">Cliente:</span> {proyecto.cliente}</div>}
            {proyecto.fechaInicio && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Inicio: {format(new Date(proyecto.fechaInicio), 'd MMM yyyy', { locale: es })}
              </div>
            )}
            {proyecto.fechaFinEstimada && (
              <div>Fin estimado: {format(new Date(proyecto.fechaFinEstimada), 'd MMM yyyy', { locale: es })}</div>
            )}
            {proyecto.descripcion && <p className="text-sm text-slate-600">{proyecto.descripcion}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Estadísticas (OpenAPI ProyectoStatsResponse)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Presupuesto (h)</p>
                  <p className="text-xl font-semibold">{stats.presupuestoHoras ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Horas consumidas</p>
                  <p className="text-xl font-semibold">{stats.horasConsumidas ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Asignaciones activas</p>
                  <p className="text-xl font-semibold">{stats.asignacionesActivas ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Progreso</p>
                  <p className="text-xl font-semibold">{stats.progreso != null ? `${Math.round(stats.progreso * 100)}%` : '—'}</p>
                </div>
              </div>
            ) : (
              <Skeleton className="h-24" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Asignaciones
          </CardTitle>
          <CardDescription>Equipo asignado al proyecto (GET /proyectos/:id/asignaciones)</CardDescription>
        </CardHeader>
        <CardContent>
          {asignaciones.length === 0 ? (
            <p className="text-sm text-slate-500">No hay asignaciones</p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {asignaciones.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium">{a.usuarioId.slice(0, 8)}…</span>
                    {a.rol && <Badge variant="outline">{a.rol}</Badge>}
                    <span className="text-xs text-slate-500">
                      {format(new Date(a.fechaInicio), 'd MMM yyyy', { locale: es })}
                      {a.fechaFin && ` – ${format(new Date(a.fechaFin), 'd MMM yyyy', { locale: es })}`}
                    </span>
                  </div>
                  {canManageProjects && (
                    <AsignacionActions proyectoId={id} asigId={a.id} />
                  )}
                </li>
              ))}
            </ul>
          )}
          {canManageProjects && (
            <div className="mt-4">
              <AddAsignacionButton proyectoId={id} empleados={empleados} />
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="tareas" className="space-y-6">
          <TaskList proyectoId={id} tareas={tareas} isLoading={tareasLoading} />
          <TaskGanttChart tareas={tareas} isLoading={tareasLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AsignacionActions({ proyectoId, asigId }: { proyectoId: string; asigId: string }) {
  const deleteAsignacion = useDeleteAsignacion(proyectoId);

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta asignación?')) return;
    try {
      await deleteAsignacion.mutateAsync(asigId);
      toast.success('Asignación eliminada');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-600">
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

function AddAsignacionButton({
  proyectoId,
  empleados,
}: {
  proyectoId: string;
  empleados: { id: string; nombre: string; apellidos?: string; email: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Añadir asignación
      </Button>
      {open && (
        <AddAsignacionModal
          proyectoId={proyectoId}
          empleados={empleados}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function AddAsignacionModal({
  proyectoId,
  empleados,
  onClose,
}: {
  proyectoId: string;
  empleados: { id: string; nombre: string; apellidos?: string; email: string }[];
  onClose: () => void;
}) {
  const [usuarioId, setUsuarioId] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [rol, setRol] = useState('');
  const createAsignacion = useCreateAsignacion(proyectoId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioId || !fechaInicio) {
      toast.error('Usuario y fecha de inicio son obligatorios');
      return;
    }
    try {
      await createAsignacion.mutateAsync({
        usuarioId,
        fechaInicio,
        fechaFin: fechaFin || undefined,
        rol: rol || undefined,
      });
      toast.success('Asignación creada');
      onClose();
    } catch {
      toast.error('Error al crear asignación');
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir asignación (CreateAsignacionRequest)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Usuario *</Label>
            <Select value={usuarioId} onValueChange={setUsuarioId} required>
              <SelectTrigger><SelectValue placeholder="Seleccionar usuario" /></SelectTrigger>
              <SelectContent>
                {empleados.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.nombre} {u.apellidos ?? ''} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fecha inicio *</Label>
            <Input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Fecha fin</Label>
            <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Rol</Label>
            <Input value={rol} onChange={(e) => setRol(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={createAsignacion.isPending}>Crear</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
