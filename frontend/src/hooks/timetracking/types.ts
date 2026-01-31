export type TimetrackingEstado = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface TimeEntry {
  id: string;
  usuarioId: string;
  proyectoId: string;
  fecha: string;
  horas: number;
  descripcion: string;
  facturable: boolean;
  estado: TimetrackingEstado;
  aprobadoPor?: string;
  aprobadoAt?: string;
  rechazadoPor?: string;
  rechazadoAt?: string;
  comentarioRechazo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimetrackingListResponse {
  data: TimeEntry[];
}

export interface TimeEntryFilters {
  usuarioId?: string;
  proyectoId?: string;
  estado?: TimetrackingEstado;
  fechaInicio?: string;
  fechaFin?: string;
  facturable?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateTimeEntryData {
  proyectoId: string;
  usuarioId?: string;
  fecha: string;
  horas: number;
  descripcion: string;
  facturable?: boolean;
}

export interface UpdateTimeEntryData {
  fecha?: string;
  horas?: number;
  descripcion?: string;
  facturable?: boolean;
}

export interface TimetrackingResumenResponse {
  totalHoras: number;
  horasFacturables: number;
  horasNoFacturables: number;
  porProyecto: { proyectoId: string; nombre?: string; horas: number }[];
  porDia: { fecha: string; horas: number }[];
  porEstado: { estado: string; horas: number }[];
}

export interface PendienteAprobacionGrupo {
  usuarioId: string;
  usuarioNombre?: string;
  proyectoId: string;
  proyectoNombre?: string;
  totalHoras: number;
  registros: TimeEntry[];
}

export interface PendientesAprobacionResponse {
  data: PendienteAprobacionGrupo[];
}

export interface CopyTimeEntryResponse {
  copied: number;
  message: string;
}
