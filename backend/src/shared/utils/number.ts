/**
 * Utilidades compartidas para manejo seguro de números.
 * Consolida funciones duplicadas en múltiples módulos (dashboard, timetracking, proyectos, usuarios).
 *
 * @module shared/utils/number
 */

/**
 * Convierte un valor desconocido a número de forma segura.
 * Si el valor no puede convertirse, devuelve un fallback.
 *
 * @param value - Valor a convertir (puede ser number, string, null, undefined)
 * @param fallback - Valor por defecto si la conversión falla (por defecto 0)
 * @returns Número convertido o fallback
 *
 * @example
 * ```typescript
 * toNumber('42') // 42
 * toNumber('invalid', 10) // 10
 * toNumber(null) // 0
 * toNumber(undefined, 100) // 100
 * ```
 */
export const toNumber = (value: unknown, fallback = 0): number => {
  if (value === null || value === undefined) return fallback;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Convierte un valor desconocido a número o undefined.
 * Útil para valores opcionales donde undefined es válido.
 *
 * @param value - Valor a convertir
 * @returns Número convertido o undefined
 *
 * @example
 * ```typescript
 * toNumberOrUndefined('42') // 42
 * toNumberOrUndefined('invalid') // undefined
 * toNumberOrUndefined(null) // undefined
 * ```
 */
export const toNumberOrUndefined = (value: unknown): number | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};
