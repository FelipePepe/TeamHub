import type { Departamento, User } from '../../store/index.js';
import { resolveActiveState } from './utils.js';

type UserResponseInput = {
  id: string;
  email: string;
  nombre: string;
  apellidos?: string | null;
  rol: string;
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

export const toUserResponse = (user: UserResponseInput | User) => ({
  id: user.id,
  email: user.email,
  nombre: user.nombre,
  apellidos: user.apellidos ?? undefined,
  rol: user.rol,
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
