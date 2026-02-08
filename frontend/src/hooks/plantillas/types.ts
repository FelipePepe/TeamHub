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

/** Conforme al contrato TareaPlantillaResponse de OpenAPI */
export interface TareaPlantilla {
  id: string;
  plantillaId: string;
  titulo: string;
  descripcion?: string;
  orden: number;
  categoria: CategoriaTarea;
  responsableTipo: TipoResponsable;
  responsableId?: string;
  diasDesdeInicio?: number;
  duracionEstimadaHoras?: number;
  obligatoria?: boolean;
  requiereEvidencia?: boolean;
  instrucciones?: string;
  recursosUrl?: string[];
  dependencias?: string[];
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

/** Conforme al contrato CreateTareaPlantillaRequest de OpenAPI */
export interface CreateTareaPlantillaData {
  titulo: string;
  descripcion?: string;
  orden: number;
  categoria: CategoriaTarea;
  responsableTipo: TipoResponsable;
  responsableId?: string;
  diasDesdeInicio?: number;
  duracionEstimadaHoras?: number;
  obligatoria?: boolean;
  requiereEvidencia?: boolean;
  instrucciones?: string;
  recursosUrl?: string[];
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
  responsableTipo: TipoResponsable;
  responsableId?: string;
  diasDesdeInicio?: number;
  duracionEstimadaHoras?: number;
  obligatoria?: boolean;
  requiereEvidencia?: boolean;
  instrucciones?: string;
  recursosUrl?: string[];
  dependencias?: string[];
}

/** Conforme al contrato UpdateTareaPlantillaRequest de OpenAPI */
export interface UpdateTareaPlantillaData {
  titulo?: string;
  descripcion?: string;
  orden?: number;
  categoria?: CategoriaTarea;
  responsableTipo?: TipoResponsable;
  responsableId?: string;
  diasDesdeInicio?: number;
  duracionEstimadaHoras?: number;
  obligatoria?: boolean;
  requiereEvidencia?: boolean;
  instrucciones?: string;
  recursosUrl?: string[];
  dependencias?: string[];
}
