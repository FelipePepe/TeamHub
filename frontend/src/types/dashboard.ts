// Dashboard types

export interface ChartDataPoint {
  id: string;
  label: string;
  value: number;
}

export interface TimeSeriesPoint {
  fecha: string;
  value: number;
}

export interface ActivityItem {
  id: string;
  tipo: string;
  descripcion: string;
  fecha?: string;
  operation?: string;
  tableName?: string;
  recordId?: string;
  usuarioId?: string;
  usuarioEmail?: string;
  changedFields?: string[];
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
}

export interface AlertItem {
  id: string;
  titulo: string;
  descripcion?: string;
  prioridad: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA';
  fecha?: string;
}

// Admin Dashboard
export interface AdminDashboardData {
  kpis: {
    usuariosActivos: number;
    altasMes: number;
    proyectosActivos: number;
    horasMes: number;
    onboardingsEnCurso: number;
    tareasVencidas: number;
  };
  charts: {
    usuariosPorRol: ChartDataPoint[];
    usuariosPorDepartamento: ChartDataPoint[];
    proyectosPorEstado: ChartDataPoint[];
    horasPorEstado: ChartDataPoint[];
  };
  listas: {
    actividadReciente: ActivityItem[];
    alertasCriticas: AlertItem[];
  };
}

// RRHH Dashboard
export interface OnboardingEnCurso {
  procesoId: string;
  empleadoId: string;
  empleadoNombre: string;
  progreso: number;
  fechaInicio: string;
  fechaFinEsperada?: string;
}

export interface RRHHDashboardData {
  kpis: {
    onboardingsEnCurso: number;
    completadosMes: number;
    tiempoMedioOnboardingDias: number;
    tareasVencidas: number;
  };
  charts: {
    empleadosPorDepartamento: ChartDataPoint[];
    evolucionAltas: TimeSeriesPoint[];
  };
  sections: {
    onboardingsEnCurso: OnboardingEnCurso[];
    alertas: AlertItem[];
  };
}

// Manager Dashboard
export interface EquipoOcupacion {
  usuarioId: string;
  nombre: string;
  ocupacion: number;
  proyectosActivos: number;
  horasPendientes: number;
}

export interface PendienteAprobacion {
  registroId: string;
  usuarioNombre: string;
  proyectoNombre: string;
  fecha: string;
  horas: number;
}

export interface ManagerDashboardData {
  kpis: {
    miembrosEquipo: number;
    cargaPromedio: number;
    horasPendientesAprobar: number;
    proyectosActivos: number;
  };
  charts: {
    equipoPorProyecto: ChartDataPoint[];
    horasEquipoSemana: TimeSeriesPoint[];
  };
  sections: {
    equipoOcupacion: EquipoOcupacion[];
    pendientesAprobacion: PendienteAprobacion[];
  };
}

// Empleado Dashboard
export interface ProximaTarea {
  tareaId: string;
  titulo: string;
  fechaLimite?: string;
}

export interface MiProyecto {
  proyectoId: string;
  nombre: string;
  rol?: string;
  dedicacionPorcentaje: number;
}

export interface EmpleadoDashboardData {
  kpis: {
    horasMes: number;
    proyectosActivos: number;
    ocupacion: number;
    tareasPendientes: number;
  };
  charts: {
    horasPorEstado: ChartDataPoint[];
    horasPorSemana: TimeSeriesPoint[];
  };
  sections: {
    onboarding: {
      progreso: number;
      proximasTareas: ProximaTarea[];
    };
    misProyectos: MiProyecto[];
  };
}
