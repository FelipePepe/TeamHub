import type { Departamento, User } from '../../store/index.js';
import { resolveActiveState } from './utils.js';

type UserResponseInput = {
  id: string;
  email: string;
  nombre: string;
  apellidos?: string | null;
  rol: string;
  departamentoId?: string | null;
  departamentoNombre?: string | null;
  managerId?: string | null;
  managerNombre?: string | null;
  activo?: boolean;
  deletedAt?: Date | string | null;
};

type DepartamentoResponseInput = {
  id: string;
  nombre: string;
  codigo: string;
  descripcion?: string | null;
  responsableId?: string | null;
  color?: string | null;
  activo?: boolean;
  deletedAt?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

/**
 * Transforma un usuario de la base de datos al formato de respuesta API.
 * Incluye `departamentoNombre` cuando se proporciona (resuelto via LEFT JOIN).
 * @param user - Entidad de usuario desde DB o input con campos opcionales
 * @returns Objeto sanitizado conforme al contrato UserResponse de OpenAPI
 */
export const toUserResponse = (user: UserResponseInput | User) => ({
  id: user.id,
  email: user.email,
  nombre: user.nombre,
  apellidos: user.apellidos ?? undefined,
  rol: user.rol,
  departamentoId: user.departamentoId ?? undefined,
  departamentoNombre: (user as UserResponseInput).departamentoNombre ?? undefined,
  managerId: user.managerId ?? undefined,
  managerNombre: (user as UserResponseInput).managerNombre ?? undefined,
  activo: resolveActiveState(user),
});

export const toDepartamentoResponse = (
  departamento: DepartamentoResponseInput | Departamento
) => ({
  id: departamento.id,
  nombre: departamento.nombre,
  codigo: departamento.codigo,
  descripcion: departamento.descripcion,
  responsableId: departamento.responsableId,
  color: departamento.color,
  activo: resolveActiveState(departamento),
  createdAt: departamento.createdAt,
  updatedAt: departamento.updatedAt,
});
