import { z } from 'zod';

export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const dateTimeSchema = z.string();

const parseBooleanString = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

const parseNumberString = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') return value;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
};

export const booleanFromString = z.preprocess(parseBooleanString, z.boolean());

export const numberFromString = z.preprocess(parseNumberString, z.number());

export const optionalNumberFromString = z.preprocess(parseNumberString, z.number().optional());

export const optionalBooleanFromString = z.preprocess(parseBooleanString, z.boolean().optional());
