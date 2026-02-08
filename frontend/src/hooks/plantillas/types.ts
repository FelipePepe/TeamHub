export type RolDestino = 'ADMIN' | 'RRHH' | 'MANAGER' | 'EMPLEADO';

export type CategoriaTarea =
  | 'DOCUMENTACION'
  | 'EQUIPAMIENTO'
  | 'ACCESOS'
  | 'FORMACION'
  | 'REUNIONES'
  | 'ADMINISTRATIVO';

export type TipoResponsable = 'RRHH' | 'MANAGER' | 'IT' | 'EMPLEADO' | 'CUSTOM';

export interface Plantilla {
  id: string;
  nombre: string;
  descripcion?: string;
  departamentoId?: string;
  departamentoNombre?: string;
  rolDestino?: RolDestino;
  duracionEstimadaDias?: number;
  activo: boolean;
  totalTareas?: number;
  creadoPor: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface TareaPlantilla {
  id: string;
  plantillaId: string;
  titulo: string;
  descripcion?: string;
  orden: number;
  categoria: CategoriaTarea;
  responsable: TipoResponsable;
  responsablePersonalizadoId?: string;
  duracionEstimadaDias?: number;
  esOpcional: boolean;
  requiereAprobacion: boolean;
  dependencias?: string[];
  creadoEn: string;
  actualizadoEn: string;
}

export interface PlantillaFilters {
  departamentoId?: string;
  activo?: boolean;
}

export interface PlantillaListResponse {
  plantillas: Plantilla[];
  total: number;
}

export interface TareasPlantillaListResponse {
  tareas: TareaPlantilla[];
  total: number;
}

export interface CreatePlantillaData {
  nombre: string;
  descripcion?: string;
  departamentoId?: string;
  rolDestino?: RolDestino;
  duracionEstimadaDias?: number;
  activo?: boolean;
}

export interface UpdatePlantillaData {
  nombre?: string;
  descripcion?: string;
  departamentoId?: string;
  rolDestino?: RolDestino;
  duracionEstimadaDias?: number;
  activo?: boolean;
}

export interface CreateTareaPlantillaData {
  titulo: string;
  descripcion?: string;
  orden: number;
  categoria: CategoriaTarea;
  responsable: TipoResponsable;
  responsablePersonalizadoId?: string;
  duracionEstimadaDias?: number;
  esOpcional?: boolean;
  requiereAprobacion?: boolean;
  dependencias?: string[];
}

export interface CreateTareaPlantillaMutationParams {
  plantillaId: string;
  data: CreateTareaPlantillaData;
}

export interface CreateTareaPlantillaWithAllFields {
  plantillaId: string;
  titulo: string;
  descripcion?: string;
  orden: number;
  categoria: CategoriaTarea;
  responsable: TipoResponsable;
  responsablePersonalizadoId?: string;
  duracionEstimadaDias?: number;
  esOpcional?: boolean;
  requiereAprobacion?: boolean;
  dependencias?: string[];
}

export interface UpdateTareaPlantillaData {
  titulo?: string;
  descripcion?: string;
  orden?: number;
  categoria?: CategoriaTarea;
  responsable?: TipoResponsable;
  responsablePersonalizadoId?: string;
  duracionEstimadaDias?: number;
  esOpcional?: boolean;
  requiereAprobacion?: boolean;
  dependencias?: string[];
}
