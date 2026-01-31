import type { Timetracking } from '../../store/index.js';
import { toNumberOrUndefined } from './utils.js';

type TimetrackingResponseInput = {
  id: string;
  usuarioId: string;
  proyectoId: string;
  fecha: string | Date;
  horas: number | string;
  descripcion: string;
  facturable: boolean;
  estado: string;
  aprobadoPor?: string | null;
  aprobadoAt?: string | Date | null;
  rechazadoPor?: string | null;
  rechazadoAt?: string | Date | null;
  comentarioRechazo?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export const toTimetrackingResponse = (
  registro: TimetrackingResponseInput | Timetracking
) => ({
  id: registro.id,
  usuarioId: registro.usuarioId,
  proyectoId: registro.proyectoId,
  fecha: registro.fecha,
  horas: toNumberOrUndefined(registro.horas),
  descripcion: registro.descripcion,
  facturable: registro.facturable,
  estado: registro.estado,
  aprobadoPor: registro.aprobadoPor,
  aprobadoAt: registro.aprobadoAt,
  rechazadoPor: registro.rechazadoPor,
  rechazadoAt: registro.rechazadoAt,
  comentarioRechazo: registro.comentarioRechazo,
  createdAt: registro.createdAt,
  updatedAt: registro.updatedAt,
});
