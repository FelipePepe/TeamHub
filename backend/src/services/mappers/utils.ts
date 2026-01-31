export type ActiveStateInput = {
  activo?: boolean;
  deletedAt?: Date | string | null;
};

export const resolveActiveState = (entity: ActiveStateInput) => {
  if (typeof entity.activo === 'boolean') return entity.activo;
  return !entity.deletedAt;
};

export const toNumberOrUndefined = (value: unknown) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};
