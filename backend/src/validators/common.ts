import { z } from 'zod';

export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const dateTimeSchema = z.string();

/**
 * Parses boolean from string query params.
 * Accepts: true, false, 'true', 'false'
 */
export const booleanFromString = z
  .union([z.boolean(), z.literal('true'), z.literal('false')])
  .transform((val): boolean => (typeof val === 'boolean' ? val : val === 'true'));

/**
 * Parses number from string query params.
 */
export const numberFromString = z.coerce.number();

/**
 * Optional number from string - coerces string to number, keeps number as-is.
 * Returns number | undefined
 */
export const optionalNumberFromString = z
  .union([z.number(), z.string(), z.undefined()])
  .transform((val): number | undefined => {
    if (val === undefined || val === '') return undefined;
    if (typeof val === 'number') return val;
    const num = Number(val);
    return Number.isNaN(num) ? undefined : num;
  });

/**
 * Optional boolean from string query params.
 * Returns boolean | undefined
 */
export const optionalBooleanFromString = z
  .union([z.boolean(), z.literal('true'), z.literal('false'), z.undefined()])
  .transform((val): boolean | undefined => {
    if (val === undefined) return undefined;
    if (typeof val === 'boolean') return val;
    return val === 'true';
  });
